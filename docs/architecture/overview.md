# Architecture & Patterns Overview

Diblob is more than a dependency injection container. It is a small platform of packages that help you wire, observe, and test services and applications in a consistent way.

This page gives you a high-level mental model for how the pieces fit together and points you to the canonical patterns.

## Core concepts

At the heart of diblob are two ideas: *containers* and *blobs*.

- **Blobs** are typed proxies. They are the stable identifiers you pass around your code.
- **Containers** own the concrete implementations of blobs, plus their lifecycle and disposal.

Common concepts you will see across patterns:

- **Lifecycles** – singleton, factory, and child-container scoped blobs.
- **Caching** – containers cache resolved singleton blobs so they are only constructed once.
- **Disposal** – containers can dispose blobs, and disposal cascades across dependent blobs.
- **Child containers** – containers can create child containers that inherit registrations and override or add new ones.
- **Per-request / per-job containers** – a special case of child containers used to isolate request or job scoped state.

These primitives stay the same across HTTP APIs, background workers, and front-ends. Each pattern is mostly a different way of arranging containers and choosing where to create child containers.

## Infrastructure as blobs

Most cross-cutting concerns are provided by separate packages, but they are *used* the same way: as blobs registered in a container. For example:

- **Configuration** – [`@speajus/diblob-config`](/diblob/config) loads typed configuration and registers it as blobs.
- **Logging** – [`@speajus/diblob-logger`](/diblob/logger) provides structured logging wired into the container lifecycle.
- **Telemetry** – [`@speajus/diblob-telemetry`](/diblob/telemetry) emits traces and metrics for blob resolution and app code.
- **Async context** – [`@speajus/diblob-async-context`](/diblob/async-context) exposes request or job scoped context.
- **Connect / gRPC** – [`@speajus/diblob-connect`](/diblob/connect) integrates diblob with Connect/Buf based servers and clients.
- **OAuth / OIDC** – [`@speajus/diblob-oauth`](/diblob/oauth) provides helpers for auth flows and token validation.
- **Visualizer / diagnostics** – [`@speajus/diblob-visualizer`](/visualizer/) and [diagnostics](/diblob/diagnostics) help you see how blobs are resolved.
- **Testing utilities** – [`@speajus/diblob-testing`](/diblob/testing) gives you container helpers and fake infrastructure blobs for tests.

Each package has its own documentation. The role of the Architecture & Patterns section is to show *how to use them together* in realistic applications.

## Canonical patterns

Diblob encourages a small set of repeatable patterns that you can apply across projects:

- **HTTP / Connect / gRPC service with per-request containers** – a backend service where each request gets its own child container and request context. See [HTTP / gRPC service pattern](/architecture/http-grpc-service).
- **Background worker / job runner** – a long-running process that uses per-job containers for isolation and telemetry. See [Worker pattern](/architecture/worker).
- **Svelte SPA with a shared app container** – a front-end application that uses a container for API clients, auth, and UI services. See [Svelte SPA pattern](/architecture/svelte-spa).
- **Reference application** – a small sample that ties the patterns together into one system. See [Reference app](/architecture/reference-app).

You can mix and match these patterns inside a larger system. For example, the same workspace-and-tasks domain can have:

- An HTTP API for interactive clients.
- A background worker that processes scheduled jobs.
- A Svelte SPA that talks to the API.

All three can share configuration patterns, logging, telemetry, and auth conventions because they are built on the same container and blob concepts.

## How to read this section

If you are new to diblob:

1. Skim the [Getting Started guide](/diblob/guide/getting-started).
2. Read this overview to understand the mental model.
3. Pick the pattern that matches what you are building first (service, worker, or SPA).

If you already use diblob in one context and want to adopt more pieces:

- Use the pattern pages to see how to extend your existing containers without rewriting everything.
- Refer back to individual package docs for API details and configuration options.
