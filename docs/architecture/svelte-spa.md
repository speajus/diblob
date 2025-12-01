# Svelte SPA pattern

This pattern describes a Single Page Application (SPA) built with Svelte that uses a diblob container in the browser for shared services such as API clients, auth state, and feature flags.

## When to use this pattern

Use this pattern when you are building:

- A browser-based front-end that talks to one or more diblob-backed services.
- A Svelte 5 app that wants a testable, dependency-injected client-side architecture.

You get:

- A central place to configure API clients and auth.
- A simple way to replace services in tests (for example, fake API clients).
- Symmetry with your backend container layout.

## App container layout

In the browser you typically create a single **app container** that lives for the lifetime of the page:

- **App container**:
  - API client blobs (e.g. HTTP or Connect clients).
  - Auth/session blob (tokens, logged-in user, expiration).
  - Feature flag or experiment blobs.
  - UI services (toasts, dialogs, navigation helpers).
  - Any stateful services that should be shared across components.

Components receive only the blobs they depend on, instead of importing global singletons directly.

Depending on your Svelte setup, you can:

- Create the app container in your root layout and pass it through context.
- Or provide small hooks/helpers that resolve blobs from a module-level container.

See [`@speajus/diblob-svelte`](/diblob/svelte) for integration helpers and ergonomics specific to Svelte.

## Talking to backend services

The SPA pattern is designed to complement the HTTP / Connect / gRPC service pattern:

- The app container holds API clients configured with the same base URLs and telemetry conventions as the backend.
- Auth state is managed once and reused across API calls.
- Errors can be logged and reported using the same logging and telemetry standards.

In many apps, the SPA communicates with:

- An API that follows the [HTTP / Connect / gRPC service pattern](/architecture/http-grpc-service).
- A background worker that writes data the SPA can read later.

## Testing

Because your Svelte components depend on blobs instead of hard-coded imports, you can:

- Create a test-only container with fake API clients or loggers.
- Swap out auth/session implementations for different scenarios.
- Reuse the patterns from [`@speajus/diblob-testing`](/diblob/testing) on the client side.

## Example

- `examples/example-web-svelte` – a Svelte 5 web client that uses `@speajus/diblob` and `@speajus/diblob-svelte` to talk to the `example-grpc-server` over Connect/gRPC. It demonstrates this SPA pattern in practice.

## Related docs

- [Architecture overview](/architecture/overview)
- [HTTP / Connect / gRPC service pattern](/architecture/http-grpc-service)
- [Worker pattern](/architecture/worker)
- [Svelte integration docs](/diblob/svelte)
