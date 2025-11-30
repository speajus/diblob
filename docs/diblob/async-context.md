# @speajus/diblob-async-context

`@speajus/diblob-async-context` is a small Node-only helper that uses
`AsyncLocalStorage` to expose a **per-request or per-job context value** through a
regular diblob blob.

You stay in control of the shape:

- You define your own context interface (for example `RequestContext`).
- You define the corresponding blob with `createBlob<RequestContext>()`.
- `AsyncLocalStorageContext` wires that blob to an `AsyncLocalStorage` store and
  manages the current value for that blob per async scope.

## Installation

```bash
pnpm add @speajus/diblob-async-context
```

## Core idea

1. Define a context type and blob in your app.
2. Create an `AsyncLocalStorageContext` bound to your container.
3. Wrap request/job handling in `runWithContext(blob, value, handler)`.
4. Inside the handler, resolving the blob gives you the current value.

If you prefer, you can register the blob once at startup with
`registerWithContext(blob)` so it is always available via the container; the
current value still comes exclusively from `runWithContext(blob, value, handler)`.

Accessing the context blob **outside** an active `runWithContext` scope throws a
fast, clear error.

## Defining a context type and blob

```ts
import { createBlob } from '@speajus/diblob';

interface RequestContext {
  requestId: string;
  userId?: string;
}

export const requestContext = createBlob<RequestContext>('requestContext');
```

You can define as many different context types as you need (for example,
`JobContext`, `WebSocketContext`, etc.), each with its own blob.

## Wiring AsyncLocalStorageContext

```ts
import { createContainer } from '@speajus/diblob';
import { AsyncLocalStorageContext } from '@speajus/diblob-async-context';
import { requestContext } from './context-blobs';

const container = createContainer();

// Register your other blobs (logger, config, services, etc.) here.

const asyncContext = new AsyncLocalStorageContext(container);
```

If you want the blob to be available without passing it to
`runWithContext(...)`, you can also register it once at startup:

```ts
asyncContext.registerWithContext(requestContext);
```

This:

- Registers `requestContext` as a singleton in the container.
- Causes `container.resolve(requestContext)` to return a **proxy object** that
  forwards property access to the current `AsyncLocalStorage` store.

If code tries to access the proxy when there is no active context, it throws an
error telling you to wrap work in
`AsyncLocalStorageContext.runWithContext`.

## Running work with a context

Use `runWithContext` to establish the value for a blob during a block of async
work:

```ts
asyncContext.runWithContext(blob, value, handler);
```

This both ensures the blob is wired to the async context and runs the handler
with the given value active for that blob.

```ts
import { randomUUID } from 'node:crypto';
import { requestContext } from './context-blobs';

async function handleSomething() {
	const logicalContext: RequestContext = {
		requestId: randomUUID(),
	};

	await asyncContext.runWithContext(requestContext, logicalContext, async () => {
		const ctx = await container.resolve(requestContext);

		// ctx is a proxy; properties come from the current AsyncLocalStorage store.
		console.log('handling', { requestId: ctx.requestId });
	});
}
```

All async work that is transitively awaited from the handler sees the same
context when accessing `requestContext`.

## HTTP server example (Node `http`)

A minimal pattern for wiring this into a Node HTTP server:

```ts
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { createBlob, createContainer } from '@speajus/diblob';
import { AsyncLocalStorageContext } from '@speajus/diblob-async-context';

interface RequestContext {
  requestId: string;
}

	const requestContext = createBlob<RequestContext>('requestContext');

const container = createContainer();
// register logger, services, etc.

const asyncContext = new AsyncLocalStorageContext(container);

const server = createServer((req, res) => {
  const logicalContext: RequestContext = { requestId: randomUUID() };

  asyncContext
    .runWithContext(requestContext, logicalContext, async () => {
      const ctx = await container.resolve(requestContext);
      // for example, fetch a logger and include requestId in logs
      // const appLogger = await container.resolve(logger);
      // appLogger.info('Incoming request', { requestId: ctx.requestId });

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ requestId: ctx.requestId }));
    })
    .catch((error) => {
      res.statusCode = 500;
      res.setHeader('content-type', 'text/plain');
      res.end('Internal Server Error');
      console.error('Unhandled error in request handler', error);
    });
});

server.listen(3000);
```

## Multiple context types

You can use separate context types for different subsystems by creating
independent `AsyncLocalStorageContext` instances and blobs:

```ts
interface JobContext {
  jobId: string;
}

const jobContext = createBlob<JobContext>('jobContext');

const jobAsyncContext = new AsyncLocalStorageContext(container);
```

This lets you reuse the same infra for HTTP requests, background jobs, or any
other logical unit of work, while keeping each context shape focused on what it
needs.

