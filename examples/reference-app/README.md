# Reference App: Workspaces & Tasks

This example ties together the existing diblob examples into a single "reference app" that matches the patterns described in the Architecture & Patterns docs.

It uses:

- **API service** – `examples/example-grpc-server`
- **Svelte SPA** – `examples/example-web-svelte`
- **Background worker** – `examples/example-worker-tasks`

## Prerequisites

From the **repository root** (`diblob`):

1. Install dependencies (once):

   ```bash
   pnpm install
   ```

2. Make sure any required tooling for the examples (like `buf`, `drizzle-kit`, etc.) is installed if you want to rebuild from source. See each example's README for details.

## Running the reference app

### 1. Start the API service

In one terminal, from the repository root:

```bash
pnpm --filter reference-app dev:api
```

This runs the API dev server from the reference-app package, which in turn starts `example-grpc-server`.

### 2. Start the Svelte SPA

In a second terminal, from the repository root:

```bash
pnpm --filter reference-app dev:web
```

This runs the SPA dev server from the reference-app package, which in turn starts `example-web-svelte`.

Follow the instructions in `examples/example-web-svelte/README.md` to open the UI in your browser.

### 3. Start the background worker

In a third terminal, from the repository root:

```bash
pnpm --filter example-worker-tasks dev
```

This runs the example worker loop, which uses a root worker container and per-job child containers as described in the worker pattern docs.

## How this maps to the docs

- The API service follows the **HTTP / Connect / gRPC service pattern** documented in `/architecture/http-grpc-service`.
- The Svelte SPA follows the **Svelte SPA pattern** documented in `/architecture/svelte-spa`.
- The overall system is described in `/architecture/reference-app`.

As a next step, a worker component can be added (reusing much of the API's container layout) to demonstrate the **background worker / job runner pattern** in the same domain.

