# Reference application

The reference application ties together the service, worker, and Svelte SPA patterns into a single, coherent example. It is intended as a blueprint you can adapt to your own domain.

## Goals

The reference app should:

- Demonstrate a realistic but approachable domain.
- Show how to share configuration, logging, telemetry, and auth across multiple processes.
- Make it easy to see how containers and blobs are arranged in each component.

A concrete implementation will live in this repository under the examples section. This page describes the intended architecture so that the example and the docs stay aligned.

## Domain overview

One suitable domain for the reference app is a simple **workspaces and tasks** system:

- Users belong to **workspaces**.
- Each workspace has **tasks** with fields such as title, status, and due date.
- A background worker periodically processes tasks to compute statistics or send notifications (for example, a digest of overdue tasks).

The exact domain is less important than the way containers are structured and how cross-cutting concerns are wired.

## Components

The reference app consists of three main components:

- **API service** – an HTTP / Connect service that exposes workspace and task operations.
- **Background worker** – a process that consumes jobs or runs on a schedule to process tasks.
- **Svelte SPA** – a browser-based front-end used by end users to manage tasks.

Each component follows one of the canonical patterns:

- The API follows the [HTTP / Connect / gRPC service pattern](/architecture/http-grpc-service).
- The worker follows the [Worker pattern](/architecture/worker).
- The front-end follows the [Svelte SPA pattern](/architecture/svelte-spa).

## Shared concerns

All components share the same approach to cross-cutting concerns:

- **Configuration** – typed schemas and environment handling via [`@speajus/diblob-config`](/diblob/config).
- **Logging** – structured logs via [`@speajus/diblob-logger`](/diblob/logger), with consistent fields such as requestId, jobId, userId, and workspaceId.
- **Telemetry** – traces and metrics via [`@speajus/diblob-telemetry`](/diblob/telemetry), configured per service.
- **Async context** – request and job context exposed via [`@speajus/diblob-async-context`](/diblob/async-context) on the backend.
- **Auth** – OAuth / OIDC flows and token validation via [`@speajus/diblob-oauth`](/diblob/oauth).
- **Diagnostics / visualizer** – container visualization and LLM-driven debugging via [`@speajus/diblob-visualizer`](/visualizer/) and [diagnostics](/diblob/diagnostics).

This common foundation makes it easy to correlate behavior across services when debugging or observing the system.

## Current examples

Today, the closest thing to this reference app in the repository is the combination of:

- `examples/example-grpc-server` – back-end Connect/gRPC service with config, logging, telemetry, database, and visualizer integration.
- `examples/example-web-svelte` – Svelte 5 web client that talks to the example-grpc-server using Connect and visualizes both client and server containers.
- `examples/example-worker-tasks` – a background worker example that uses a root worker container and per-job child containers.
- `examples/reference-app` – a thin wrapper package/README that explains how to run all three together as a single reference app.

These examples already illustrate most of the architecture described on this page. Over time, the worker and API can be expanded to share more configuration, logging, and domain concepts so that all three patterns (API, worker, SPA) are configured and documented together.

## Running the reference app

Once the dedicated reference app is implemented, this section will link to:

- A top-level README that explains how to start all components locally.
- Example configuration files and environment variable layouts.
- End-to-end tests that exercise the full system.

Until then, you can use this page as a checklist when designing your own multi-component system on top of diblob and refer to the existing examples for concrete code.

## Related docs

- [Architecture overview](/architecture/overview)
- [HTTP / Connect / gRPC service pattern](/architecture/http-grpc-service)
- [Worker pattern](/architecture/worker)
- [Svelte SPA pattern](/architecture/svelte-spa)
- [ADR-0007: Architecture & Patterns docs](/internal/ADR-0007-architecture-patterns)
