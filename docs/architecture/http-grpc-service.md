# HTTP / Connect / gRPC service pattern

This pattern describes a backend service where each incoming request gets its own child container and request-scoped context, while sharing infrastructure from a root container.

It applies to HTTP servers, Connect/Buf servers, and other RPC stacks that can call into your handlers with a request object.

## When to use this pattern

Use this pattern when you are building:

- Public or internal HTTP APIs.
- Connect / gRPC services.
- Edge gateways or BFFs that fan out to other services.

You get:

- A single place to wire infrastructure (logging, config, telemetry, auth, DB).
- A clear request scope for IDs, auth claims, and feature flags.
- A natural boundary for disposal and cleanup at the end of each request.

## Container layout

The high-level shape looks like this:

- **Root container** (process scoped):
  - Configuration (typed schemas via diblob-config).
  - Logger (diblob-logger).
  - Telemetry (diblob-telemetry).
  - OAuth / OIDC client and token validation (diblob-oauth).
  - Async context infrastructure (diblob-async-context).
  - Database clients and other connection-heavy infrastructure.
  - Any pure services that are safe to share across requests.

- **Per-request child container**:
  - Request context blob (requestId, userId, workspaceId, etc.).
  - Authenticated user / session blob.
  - Request-scoped feature flags or AB testing context.
  - Any stateful services that must not leak across requests.

Handlers depend only on blobs. They do not know whether a blob came from the root or the child container.

## Request lifecycle

A typical request flows like this:

1. The HTTP/Connect server receives a request.
2. The server creates a requestId and basic metadata (method, path, peer address).
3. A **per-request child container** is created from the root container.
4. The async context adapter is bound to this request and stores the request context blob.
5. Middleware or an auth handler validates tokens using diblob-oauth and updates the context (userId, scopes, workspaceId).
6. The actual handler uses blobs (logger, repositories, feature flags, etc.) and never reaches into AsyncLocalStorage directly.
7. When the request completes, the child container is disposed, which cascades disposal to request-scoped blobs.

Throughout the lifetime of the request:

- Logging is correlated by requestId and userId.
- Telemetry spans cover the HTTP handler and any downstream calls.
- The visualizer can show how blobs were resolved for this request.

## Cross-cutting concerns

In this pattern you normally enable:

- **Configuration** – load all server config at startup via [`@speajus/diblob-config`](/diblob/config).
- **Logging** – register a process-wide logger via [`@speajus/diblob-logger`](/diblob/logger) and derive request-scoped log contexts.
- **Telemetry** – register spans and metrics via [`@speajus/diblob-telemetry`](/diblob/telemetry), including request latency and error counts.
- **Async context** – expose a typed request context via [`@speajus/diblob-async-context`](/diblob/async-context).
- **Auth** – handle OAuth / OIDC flows and token validation via [`@speajus/diblob-oauth`](/diblob/oauth).
- **Visualizer / diagnostics** – enable visual inspection of resolutions via [`@speajus/diblob-visualizer`](/visualizer/) and [diagnostics](/diblob/diagnostics).

Each of these packages is documented separately. This page focuses on **where they live in the container graph** and **when they are resolved during a request**.

## Examples

- `examples/example-grpc-server` – a full Connect/gRPC server using diblob-connect, typed configuration, logging, telemetry, Drizzle ORM, and the visualizer. It is a concrete implementation of this pattern.
- `examples/oauth-cognito` – a Node HTTP server that demonstrates OAuth/OIDC flows, AsyncLocalStorage-based request context, and logging. It follows the same per-request container and context ideas.

## Related docs

- [Architecture overview](/architecture/overview)
- [Worker pattern](/architecture/worker)
- [Request context ADR](/internal/ADR-0005-request-context)
- [OpenTelemetry ADR](/internal/ADR-0006-opentelemetry-diblob)
