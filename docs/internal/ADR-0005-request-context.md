# ADR-0005: Use AsyncLocalStorage for Request-Scoped Context Blob

**Status:** Accepted  
**Date:** 2025-11-30

## 1. Context

Our backend needs a reliable way to store and access **request-scoped data** (the "context blob") across multiple layers without threading parameters through every function. Typical data includes:

- `requestId` / correlation ID
- `userId`, roles, permissions
- `tenantId` / organization ID
- locale and feature flags
- tracing and diagnostic identifiers

The system is multi-user and highly concurrent: a Node.js server handles many parallel HTTP requests (and potentially background jobs) using `async`/`await` and Promise-based I/O. We must ensure that:

- Each request has its **own isolated context**.
- Context follows the **async call chain** across our application and infrastructure layers.
- Context is easily available for **logging, tracing, and authorization**.

### 1.1 Technology assumptions

- **Runtime:** Node.js current LTS (≥ 20.x), which provides stable `AsyncLocalStorage` in `node:async_hooks`.
- **Language:** TypeScript/JavaScript with `async`/`await` as the primary async style.
- **Frameworks:** HTTP framework(s) such as Express, Fastify, NestJS, or similar, providing per-request middleware hooks.
- **Environment scope:** The `AsyncLocalStorage`-based context described in this ADR is **Node-specific**. It is implemented in the `@speajus/diblob-async-context` package and is not intended to run in non-Node environments (for example, browsers or runtimes that do not provide `node:async_hooks`).

### 1.2 Constraints

- Must **not leak data** between concurrent requests or users.
- Must be compatible with `async`/`await`, Promises, and typical Node I/O libraries.
- Must be **observable** (usable from logging and tracing) and **testable**.
- Overhead must remain acceptable under high concurrency.

## 2. Decision

We will introduce a **single shared `AsyncLocalStorage` instance** that manages a **request-scoped context blob**. The blob is created and initialized at the start of each request, is visible throughout that request's async call tree, and is discarded when the request completes.

### 2.1 Contents of the context blob

The context blob will be a typed object. Initial fields include:

- Identification: `requestId`, optional upstream IDs (e.g., `traceId`, `spanId`).
- User and tenant: `userId`, `tenantId`, roles/permissions/scopes.
- Behavior and localization: `locale`, feature flags and experiment variants.
- Observability metadata: any additional small key-value fields for logs/traces.

The shape can evolve, but data **must remain per-request** and small enough to avoid memory pressure.

### 2.2 Read/write rules

- **Read access:** Any backend code reads the current context **through a blob proxy**, not by talking to `AsyncLocalStorage` directly.
  - We define a dedicated `RequestContext` blob (e.g., `const requestContext = createBlob<RequestContext>('requestContext')`).
  - When this blob is associated with an `AsyncLocalStorageContext`, the blob proxy becomes the safe way to access the current context (for example `requestContext.requestId` or `requestContext.userId`).
- **Write access:**
  - Core fields (IDs, user, tenant, locale) are set in early request middleware when the per-request context is created.
  - Additional fields may be set by well-defined components (e.g., auth, feature-flag, or tracing middleware) that intentionally extend the context object.
- **Lifecycle window:** Writes occur only during the request lifecycle. Long-lived or detached background work must establish its own context rather than relying on an HTTP request context.

## 3. Detailed Design

### 3.1 AsyncLocalStorage-backed context and blob proxies (`@speajus/diblob-async-context`)

Instead of exposing raw `AsyncLocalStorage` to the rest of the codebase, we introduce an **`AsyncLocalStorageContext` type** in a **Node-specific package**, `@speajus/diblob-async-context`. This type owns an `AsyncLocalStorage` instance and wires it to blob proxies:

- It manages an internal `AsyncLocalStorage<TContext>` store, where `TContext` is a **generic object type provided by the caller**.
- It exposes a `runWithContext(context, handler)` method that runs a handler inside a given context object.
- It exposes a `registerWithContext(blob)` method that associates a **context blob** (a diblob `createBlob<TContext>()`) with this `AsyncLocalStorageContext`.
- It lives in the Node-targeted `@speajus/diblob-async-context` package that depends directly on `node:async_hooks`, keeping the core diblob packages platform-agnostic.

When a context blob has been registered with an `AsyncLocalStorageContext`:

- The blob proxy reads from `AsyncLocalStorage` to obtain the current context instance.
- Property access on the blob (for example `requestContext.requestId`) forwards to the context object in the current async store.
- Accessing the blob when no context is active fails fast (for example, by throwing an error), making the blob proxy the safe and canonical way to access the context.

Illustrative sketch (simplified, `@speajus/diblob-async-context` API):

```ts
import { AsyncLocalStorageContext } from "@speajus/diblob-async-context";
import { createBlob, type Blob, type Container } from "@speajus/diblob";

interface RequestContext {
	requestId: string;
	userId?: string;
	tenantId?: string;
}

// Application-owned blob; not defined in @speajus/diblob-async-context
export const requestContext = createBlob<RequestContext>("requestContext");

// Infrastructure: generic async context manager
class AsyncLocalStorageContext<TContext extends object = object> {
	constructor(private readonly container: Container) {}

	runWithContext<TResult>(
		context: TContext,
		handler: () => Promise<TResult> | TResult,
	): Promise<TResult> | TResult {
		// Delegates to AsyncLocalStorage<TContext>.run
	}

	registerWithContext(blob: Blob<TContext>): void {
		// Registers a singleton blob that proxies to the current async context store.
	}
}
```

The important property is **behavioral**: any blob associated with an `AsyncLocalStorageContext` becomes the supported, safe API for accessing the underlying context store. The actual shape of the context (`RequestContext` or otherwise) and the blob definition live in the **application or feature package**, not in `@speajus/diblob-async-context`.

### 3.2 Context creation and population

We will create the context blob in the **earliest possible middleware** for each incoming request:

1. Generate a new `requestId` (e.g., UUID or trace ID).
2. Extract authentication and tenant information from headers, tokens, or session (e.g., `userId`, `tenantId`, roles).
3. Extract other cross-cutting data such as locale, feature flags, and tracing headers.
4. Build a `RequestContext` object from these values.
5. Call `asyncLocalStorageContext.runWithContext(context, () => next())` (or framework equivalent) so that all downstream code for this request runs within the context.

### 3.3 Retrieving context downstream via blobs

Within the request's async chain, downstream code retrieves the context **through the `RequestContext` blob proxy**:

- Direct property access, e.g. `requestContext.requestId` or `requestContext.userId`.
- Small focused helpers like `fetchCurrentUserId()` or `fetchCurrentTenantId()` that read from the `requestContext` blob to clarify intent.

Because the blob proxy is wired to `AsyncLocalStorageContext`, any attempt to use it outside of a valid async context fails fast, while code running inside a request sees the correct per-request data.

### 3.4 Lifecycle binding

- The context is valid **only inside** the function passed to `asyncLocalStorageContext.runWithContext` and all async operations that are transitively awaited from it.
- When the request handler and its awaited async work complete, the associated async execution ends and the context is no longer retrievable via the `requestContext` blob (the blob will throw if used outside an active context).
- We do **not** store `RequestContext` objects in global variables, caches, or static fields.

### 3.5 Multi-user safety and isolation

`AsyncLocalStorage` associates a store with each async execution tree. For our purposes:

- Each HTTP request starts a fresh async tree and obtains its own `RequestContext` instance via `AsyncLocalStorageContext`.
- Concurrent requests have separate trees and therefore separate contexts.
- The `requestContext` blob proxy always resolves against the context associated with the current request's async execution, never that of a different request.

To avoid accidental cross-request sharing:

- We treat `RequestContext` instances as **request-local** and never reuse them.
- We do not cache contexts or copy them into long-lived objects.
- Fields inside the context are either scalars or short-lived objects.

### 3.6 Runtime environments

- **Node clustering (multiple processes):** Each process has its own `AsyncLocalStorage` instance via the `@speajus/diblob-async-context` package. Context never crosses process boundaries; any cross-process communication must serialize needed context fields explicitly.
- **Worker threads:** Each worker thread has its own `AsyncLocalStorage`. If we send work to workers, we pass relevant context fields as parameters/messages and, if needed, establish a new context in the worker.
- **Serverless on Node:** For Node-based serverless handlers (e.g., AWS Lambda using the Node runtime), we treat each invocation as a request. The handler initializes a `RequestContext` per invocation and runs the invocation logic inside `runWithContext`.
- **Non-Node runtimes:** This ADR does **not** define behavior for non-Node runtimes (for example, browser-based code or edge runtimes without `node:async_hooks`). Those environments will require alternative context mechanisms or separate packages.

Where frameworks or libraries may break async context propagation (e.g., nonstandard Promise usage or callback-based APIs), we will:

- Prefer libraries known to be compatible with `AsyncLocalStorage`.
- Wrap problematic APIs so that new async work is created and awaited from within the existing context.

## 4. Security, Safety, and Reliability

### 4.1 Preventing cross-request data leakage

- A new context blob is created for each request and is not reused.
- We never store `RequestContext` or its nested objects in global variables, caches, or other long-lived structures.
- Detached jobs and scheduled tasks must not use an HTTP request context; they create their own context as needed.

We will include tests that simulate concurrent requests with different users and tenants, asserting that logs and behavior always reflect the correct context.

### 4.2 Error handling and rejected promises

- If errors occur within `asyncLocalStorageContext.runWithContext`, the context remains available to error handlers in the same async tree, so they can log `requestId`, `userId`, etc. via the `requestContext` blob.
- Once the request finishes (successfully or with error), the async tree ends and the context is no longer accessible through the blob proxies.
- We will enforce coding standards to avoid unhandled rejected Promises and to always `await` async operations that are part of a request.

### 4.3 Memory safety

- We keep the context small (IDs and small metadata only).
- We avoid storing large payloads, streams, or long-lived references in the context.
- Since we do not hold global references to `RequestContext`, the VM can garbage-collect context objects once the request's async tree completes.

### 4.4 Logging and tracing

- Logging utilities will fetch the current context and automatically attach fields like `requestId`, `userId`, and `tenantId` to log entries.
- Tracing utilities will seed span and trace data from the context (or populate the context from incoming trace headers).

This provides consistent correlation for debugging and observability.

## 5. Alternatives Considered

### 5.1 Explicit context parameters

**Description:** Pass a context object explicitly through function parameters (e.g., `fn(context, arg1, arg2)`).

**Pros:**

- Very explicit and easy to reason about.
- No reliance on `AsyncLocalStorage` or runtime features.

**Cons:**

- Intrusive: requires updating many function signatures across layers.
- Clutters APIs and makes refactoring harder.
- Easy to accidentally drop the context at some layer, causing inconsistent behavior.

**Reason not chosen:** The ergonomics and maintenance cost are high for a large, layered codebase with many cross-cutting concerns.

### 5.2 Global variables or singletons without AsyncLocalStorage

**Description:** Store context in mutable globals or singletons, perhaps keyed by request ID.

**Pros:**

- Simple to implement conceptually.
- No async hooks required.

**Cons:**

- High risk of cross-request leakage if cleanup is imperfect.
- Manual lifecycle management is error-prone under concurrency.
- Encourages unsafe global state patterns that complicate testing and reasoning.

**Reason not chosen:** Global mutable context is unsafe in a highly concurrent environment and does not meet our isolation guarantees.

### 5.3 Third-party context propagation libraries

**Description:** Use a library that abstracts context propagation (possibly wrapping `AsyncLocalStorage` or using custom mechanisms).

**Pros:**

- May offer additional features and integrations (e.g., tracing or DI).

**Cons:**

- Additional dependency surface and upgrade cost.
- Harder to debug if the library's propagation logic is opaque.
- Some libraries may lag Node.js LTS changes.

**Reason not chosen:** Node's built-in `AsyncLocalStorage` is sufficient and well-supported. A thin in-house wrapper keeps behavior transparent and debuggable.

## 6. Consequences

### 6.1 Positive consequences

- Cleaner function signatures without repeated context parameters.
- Consistent logging and tracing via implicit access to `requestId`, `userId`, and `tenantId`.
- Easier access to user, tenant, locale, and feature flags across layers.
- Clear separation of concerns: transport layers handle context creation; business logic consumes context.

### 6.2 Negative consequences and trade-offs

- Debugging context issues may require reasoning about async call chains and library behavior.
- `AsyncLocalStorage` adds a small runtime overhead that may be noticeable at extreme load and must be monitored.
- Functions may appear pure but implicitly depend on context, which can reduce transparency if not well documented.
- Some async patterns and libraries may require extra care to preserve context.

### 6.3 Limitations and mitigations

- **Detached async work (fire-and-forget):** Once control leaves the `asyncLocalStorageContext.runWithContext` scope, the HTTP context is invalid. Detached tasks must receive explicit data and, if needed, create their own context.
- **Cross-process or cross-service calls:** Context does not automatically cross process/machine boundaries. We must serialize relevant fields into headers or messages and reconstruct a new context on the receiving side.
- **Incompatible libraries:** For libraries that break async context, we will choose alternatives where possible or wrap them to run within the correct context scope.

## 7. Implementation and Migration

### 7.1 Implementation plan

1. **Add the AsyncLocalStorageContext type and generic context wiring**:
	   - Implement `AsyncLocalStorageContext<TContext extends object = object>` owning the singleton `AsyncLocalStorage<TContext>` and providing `runWithContext()` and `registerWithContext()`.
	   - Do **not** define a concrete context type or blob in `@speajus/diblob-async-context`; keep it purely generic infrastructure.
2. **Add request initialization middleware** for HTTP (and other transports as needed) to:
	   - Define an application-specific context type (for example `RequestContext`) and its blob via `createBlob<TContext>()` in the appropriate package.
	   - Build the initial context object from headers, tokens, and environment.
	   - Execute the rest of the pipeline inside `asyncLocalStorageContext.runWithContext`.
3. **Integrate with logging and tracing**, updating logging/tracing utilities to read from the `requestContext` blob.
4. **Adopt in new code**, having new components access context only via the blob proxy (or small helpers that wrap it) instead of adding new context parameters.

### 7.2 Migration strategy

- Identify areas where `requestId`, `userId`, `tenantId`, or similar are threaded through many layers.
- Gradually refactor these call chains to rely on the context blob instead of explicit parameters, starting from controllers/handlers and moving inward.
- During migration, it is acceptable to keep both mechanisms temporarily (explicit parameters plus context) until behavior is verified, then simplify.

### 7.3 Testing

- **Unit tests:**
  - Verify that `AsyncLocalStorageContext.runWithContext` and `registerWithContext` behave as expected and that the `requestContext` blob throws when used outside the scoped handler.
- **Integration tests:**
  - Simulate concurrent requests with different users/tenants and assert that logs, authorization checks, and behavior use the correct context when accessed through the blob proxies.
- **Load tests:**
  - Run high-concurrency tests to confirm there is no cross-request leakage and that performance overhead is acceptable.
- **Regression tests for known caveats:**
  - Add tests covering representative framework and library usage, including error paths and async patterns that could affect context propagation.

### 7.4 Example application: HTTP API with OAuth, async context, telemetry, and logger

This section sketches how a real Node HTTP API might combine:

- `@speajus/diblob-async-context` (generic `AsyncLocalStorageContext` only)
- `@speajus/diblob-oauth` (token verification)
- `@speajus/diblob-telemetry` (OpenTelemetry tracer/meter)
- `@speajus/diblob-logger` (structured logging)

The goal is to show how **per-request context** flows from the transport layer into business logic, and how logging and telemetry implicitly pick up `requestId` and identity information.

Illustrative (simplified) setup:

```ts
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createBlob, createContainer } from '@speajus/diblob';
import { AsyncLocalStorageContext } from '@speajus/diblob-async-context';
import { logger, registerLoggerBlobs } from '@speajus/diblob-logger';
import {
	registerTelemetryBlobs,
	registerTelemetryLoggerBlobs,
	telemetryContext,
} from '@speajus/diblob-telemetry';
import {
	accessTokenVerifier,
	oauthClientConfig,
	registerAccessTokenVerifier,
	registerOAuthClientConfigBlob,
	registerOidcClientBlobs,
} from '@speajus/diblob-oauth';

interface RequestContext {
	requestId: string;
	userId?: string;
	tenantId?: string;
}

// Application-owned context blob
const requestContext = createBlob<RequestContext>('requestContext');

// 1. Container and infrastructure blobs
const container = createContainer();

// Logging with optional Loki integration via telemetry
registerTelemetryLoggerBlobs(container, { serviceName: 'example-api' });

// Telemetry (tracer + meter)
registerTelemetryBlobs(container, {
	serviceName: 'example-api',
	exporter: 'console',
});

// OAuth/OIDC configuration and helpers
registerOAuthClientConfigBlob(container);
registerOidcClientBlobs(container);
registerAccessTokenVerifier(container);

// Async-local request context wiring: generic infrastructure
const asyncLocalStorageContext = new AsyncLocalStorageContext<RequestContext>(container);
asyncLocalStorageContext.registerWithContext(requestContext);

// Resolve commonly used blobs once at startup
const appLogger = await container.resolve(logger);
const telemetry = await container.resolve(telemetryContext);
const config = await container.resolve(oauthClientConfig);
const verifier = await container.resolve(accessTokenVerifier);

appLogger.info('example-api starting', {
	issuerUrl: config.issuerUrl,
});

// 2. HTTP server: create RequestContext per request
const server = createServer(async (req, res) => {
	const requestId = randomUUID();

	// Extract bearer token (if present)
	const authHeader = req.headers['authorization'];
	const token =
		typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
			? authHeader.slice('Bearer '.length)
			: undefined;

	const context: RequestContext = {
		requestId,
		userId: undefined,
		tenantId: undefined,
	};

	await asyncLocalStorageContext.runWithContext(context, async () => {
		const span = telemetry.tracer.startSpan('http.request', {
			attributes: {
				'http.method': req.method,
				'http.target': req.url,
				'http.request_id': requestContext.requestId,
			},
		});

		try {
			// Optionally authenticate via OAuth access token
			if (token) {
				const result = await verifier.verifyAccessToken(token, {
					requiredScopes: ['openid'],
				});

				context.userId = result.subject;
				context.tenantId = result.claims['tenant_id'] as string | undefined;
			}

			appLogger.info('Handling request', {
				requestId: requestContext.requestId,
				userId: requestContext.userId,
				tenantId: requestContext.tenantId,
			});

			// Example route handler logic that relies on the context blob
			if (req.url === '/me' && req.method === 'GET') {
				if (!requestContext.userId) {
					res.statusCode = 401;
					res.end('Unauthorized');
					return;
				}

				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.end(
					JSON.stringify({
						requestId: requestContext.requestId,
						userId: requestContext.userId,
						tenantId: requestContext.tenantId,
					}),
				);
				return;
			}

			res.statusCode = 404;
			res.end('Not Found');
		} catch (error) {
			const err = error as Error;
			appLogger.error('Request failed', {
				requestId: requestContext.requestId,
				userId: requestContext.userId,
				errorName: err.name,
				errorMessage: err.message,
			});
			res.statusCode = 500;
			res.end('Internal Server Error');
		} finally {
			span.end();
		}
	});
});

server.listen(3000, () => {
	appLogger.info('example-api listening', { port: 3000 });
});
```

In this example:

- The **transport layer** (HTTP server) is responsible for:
  - Creating a `RequestContext` per request (with a fresh `requestId`).
  - Optionally enriching that context with identity information after OAuth token verification.
  - Running request handling logic inside `asyncLocalStorageContext.runWithContext`.
- The **context blob** (`requestContext`) is the single, safe way to access the current request context from any downstream code.
- The **logger** and **telemetry** infrastructure naturally pick up `requestId`, `userId`, and `tenantId` via the context blob, without needing to thread these fields through every call.

This ADR establishes `AsyncLocalStorage` (via `@speajus/diblob-async-context`) as the standard mechanism for managing request-scoped context in our Node backend applications, with clear rules, limitations, and a migration and testing plan.
