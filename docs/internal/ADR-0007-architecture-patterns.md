# ADR-0007: Architecture & Patterns Documentation

## Status
Proposed

## Date
2025-12-01

## Context / Problem

Today the diblob documentation is rich but mostly **package-oriented**. New adopters can read about individual packages (core, logger, config, telemetry, OAuth, MCP, visualizer, Svelte, etc.), but it is harder to see:

- How the core concepts (containers, blobs, lifecycle, disposal, child containers) fit together in a real application.
- How ecosystem packages are typically composed in a production service.
- Which application architectures are "canonical" for diblob (HTTP/gRPC APIs, workers, front-ends).

This raises the cognitive load for new users and makes it harder to position diblob as a coherent platform rather than "a DI library plus a bag of extras".

## Decision

We will introduce a top-level **"Architecture & Patterns"** section in the public docs that:

- Explains the overall architecture of diblob (containers, blobs, lifecycle, disposal, async context, testing).
- Documents a small set of canonical application patterns.
- Shows how to compose core and ecosystem packages in those patterns (for example, diblob-config + diblob-logger + diblob-telemetry, Connect/gRPC integration, visualizer/diagnostics tooling, and OAuth support).

This ADR covers the documentation structure and narrative only. No new runtime features are introduced.

## Goals

- Provide a single, opinionated narrative that explains how diblob is used in typical production services.
- Reduce time-to-understanding for new users by showing end-to-end flows rather than only per-package APIs.
- Make it clear that diblob is a **platform** (DI + ecosystem) rather than just a DI container.
- Highlight recommended patterns for composing multiple packages in one app.

## Non-goals

- Rewriting every existing package page from scratch.
- Creating a code generator or project scaffolding tool.
- Prescribing a single HTTP or gRPC framework, or a single front-end stack.
- Combining configuration and telemetry into a single docs section (those remain documented separately and are referenced from the patterns).

## Architecture & Patterns section structure

We will add a top-level "Architecture & Patterns" section to the public docs, with at least the following subpages:

1. **Overall architecture overview**
   - Core concepts: containers, blobs, lifecycles (singleton/factory/child), caching, disposal, cascading disposal.
   - How infrastructure concerns (logging, config, telemetry, OAuth, async context, testing, visualizer, Svelte integration) plug in as blobs and registration helpers.
   - How child containers and per-request containers work conceptually.

2. **Canonical application patterns**
   Each pattern describes the architecture diagram, container layout, key blobs, and how ecosystem packages are composed. Initial patterns:

   - **HTTP/gRPC service with per-request containers**
     - Root application container for shared infrastructure (logger, config, telemetry, OAuth, async context, database clients, etc.).
     - Per-request child containers created per HTTP/gRPC request, with request-scoped blobs (request context, correlation IDs, auth, feature flags).
     - Integration points for `@speajus/diblob-telemetry`, `@speajus/diblob-logger`, async context, and the visualizer.

   - **Background worker / job runner**
     - Long-lived worker process with a root container.
     - Per-job child containers that encapsulate job-specific state, retries, and telemetry.
     - Interaction with configuration and telemetry for scheduled or queue-based work.

   - **Svelte SPA with a shared app container**
     - Browser-side container holding shared blobs (API clients, feature flags, auth/session state, UI services).
     - How the SPA can consume backends that follow the diblob patterns (e.g., HTTP APIs with consistent logging and telemetry).

3. **Composition examples across ecosystem packages**
   - Small, concrete compositions that show how to use multiple packages together in a single app, for example:
     - `@speajus/diblob-config` + `@speajus/diblob-logger` + `@speajus/diblob-telemetry` in a gRPC or HTTP service.
     - `@speajus/diblob-config` + OAuth package + async context for secure, multi-tenant APIs.
     - Visualizer integration for observing blob resolution in a real service.
   - These examples reference existing package docs for detailed configuration, rather than duplicating them.

## Consequences

### Positive

- **DX:** Faster onboarding and lower cognitive load; new users see a few canonical ways to structure applications instead of stitching patterns together themselves.
- **Adoption:** Positions diblob as a coherent platform with a clear architectural story.
- **Consistency:** Encourages a small set of recommended patterns, which future examples and guides can reuse.

### Negative / Trade-offs

- Additional documentation surface area that must be maintained and kept in sync with evolving packages.
- Some duplication of high-level concepts between package pages and the new architecture overview.
- Requires light restructuring of existing example docs to point at the new patterns.

## Implementation Plan

1. **Define the outline and navigation**
   - Add an "Architecture & Patterns" section to the VitePress navigation as a top-level item.
   - Decide the precise page structure and URLs (for example, `docs/architecture/overview.md`, `docs/architecture/http-grpc-service.md`, `docs/architecture/worker.md`, `docs/architecture/svelte-spa.md`).

2. **Draft the overall architecture overview**
   - Describe containers, blobs, lifecycles, disposal, and child containers using existing internal docs (SPEC, ADRs) as inputs.
   - Show a simple diagram or narrative of how a typical diblob-based service is wired.

3. **Author canonical pattern pages**
   - For each of the initial patterns (HTTP/gRPC service, background worker, Svelte SPA), document:
     - Container structure and blob responsibilities.
     - Where per-request or per-job containers are created.
     - How logging, config, telemetry, OAuth, async context, and testing fit in.
   - Reference concrete examples from the repo (e.g., example-grpc-server, example web apps) where available.
   - Avoid duplicating package-specific documentation; link to existing package pages for detailed configuration and API reference.

4. **Add composition examples**
   - Create small, focused sections or mini-guides that show how to wire together multiple ecosystem packages in each pattern.
   - Ensure telemetry and configuration remain documented as separate topics, but are clearly referenced from the patterns.

5. **Wire examples and package docs to the new section**
   - Update existing docs and examples to link to the relevant architecture pattern pages.
   - Ensure internal docs (ADRs, SPEC) reference the new section where appropriate.
6. **Define a reference application**
   - Create a new reference app that combines an HTTP API, Svelte front-end, and background worker, showcasing all of the documented patterns working together.

## Open Questions

- **Future patterns:** Which additional patterns (for example, multi-tenant SaaS, event-driven systems, multi-region deployments) should be documented next?
- **Future tooling:** What is the right scope and UX for tools that can help:
  - Quick start a new project with diblob.
  - Manage configuration and environment variables.
  - Manage secrets and encryption.
  - Manage logging and telemetry.
  - Manage authentication and authorization.
  - Manage database connections and migrations.
  - Manage caching and invalidation.
  - Manage queuing and background processing.