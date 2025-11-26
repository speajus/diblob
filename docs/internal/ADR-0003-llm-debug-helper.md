# ADR-0003: LLM-driven debugging helper via MCP diagnostics

## Status
Proposed

## Date
2025-11-26

## Context / Problem
- During incidents, developers and operators must manually correlate logs, metrics, and traces across blobs and containers to understand what is failing.
- We already have:
  - `@speajus/diblob-logger` for structured, blob-aware logging (often exporting to Loki).
  - `@speajus/diblob-telemetry` for OpenTelemetry-based metrics and traces.
  - `@speajus/diblob-mcp` for exposing container-based functionality to LLMs via the Model Context Protocol.
- Today, each application that wants “LLM-assisted debugging” must invent its own way to:
  - Query logs and metrics.
  - Decide which blobs are interesting.
  - Compress this data into an LLM-sized context.
- There is no canonical, reusable "diagnostic snapshot" for a container that:
  - Aggregates recent logs and metrics **per blob**.
  - Highlights hot spots and recent errors.
  - Is directly consumable by an MCP tool and by a simple UI.
- As a result, it is hard to build consistent, reliable AI assistants that help triage incidents across diblob-based services.

## Goals
- Define a **diagnostic snapshot model** that summarizes recent logs and metrics per blob.
- Implement reusable aggregation logic using **diblob-logger** and **diblob-telemetry** (no custom per-app collectors).
- Expose diagnostics via:
  - An **MCP tool** suitable for LLMs.
  - A small **service API** for human-facing dashboards.
- Provide an **example frontend** that calls these services and shows how to surface diagnostics for on-call triage.
- Keep the design container-centric and compatible with existing lifecycle and telemetry patterns.

## Non-goals
- Building a full incident management system (alerts, paging, runbooks, ticketing).
- Implementing an LLM orchestration layer; we only provide data and a convenient MCP tool.
- Cross-service/global aggregation; this ADR focuses on a single diblob container / service instance.

## Decision
We will introduce a reusable **diagnostics helper** built on diblob-logger and diblob-telemetry that:

1. Defines a container-aware diagnostics model summarizing recent activity **per blob**.
2. Implements aggregation logic as blobs that read from existing logging and telemetry sinks.
3. Exposes this aggregation through:
   - A new MCP tool in `@speajus/diblob-mcp` that returns a summarized diagnostic view.
   - A small service API (Connect/HTTP) that returns the same data to human-facing clients.
4. Ships with an example frontend (likely Svelte-based) that calls these services and renders blob-centric diagnostics.

This creates a standard way for AI assistants and dashboards to ask, "What is going wrong in this service right now?" without custom per-app plumbing.

## Design Overview

### Diagnostics model
We define a conceptual diagnostics model (exact types may evolve):

- `BlobDiagnosticsSummary`
  - `blobName: string`
  - `logCountsByLevel: { error: number; warn: number; info: number; debug: number }`
  - `recentErrors: { timestamp: string; message: string; fields?: Record<string, unknown> }[]`
  - `metrics: {
      resolutionCount?: number;
      errorCount?: number;
      avgResolutionMs?: number;
      p95ResolutionMs?: number;
    }`
  - `health: 'healthy' | 'degraded' | 'failing'`
- `DiagnosticsSnapshot`
  - `generatedAt: string`
  - `windowSeconds: number`
  - `summaries: BlobDiagnosticsSummary[]`
  - `notes?: string` (free-form text for humans/LLMs)

The helper computes health heuristics from metrics and logs (e.g., many recent errors or high p95 -> `degraded` or `failing`).

### Data sources

- **Logs (diblob-logger)**
  - We rely on `@speajus/diblob-logger` to emit structured logs tagged with blob identity (`blobName`), container id, and severity level.
  - We will add or standardize log fields as needed (e.g., `blobName`, `resolutionKind`) but avoid breaking existing log formats.
  - Aggregation reads from an in-memory buffer or from a backing store (e.g., Loki) via a small adapter interface so the helper remains testable.

- **Metrics (diblob-telemetry)**
  - We reuse metrics from `@speajus/diblob-telemetry` (e.g., resolution counters and histograms) rather than introducing new instrumentation.
  - A small adapter will query recent metric data and calculate per-blob statistics such as total resolutions, error counts, and latency percentiles.

### Aggregation and helper blobs

We introduce diagnostics helper blobs (names illustrative):

- `DiagnosticsWindowConfig` – configuration blob (time window, max blobs, max events per blob, etc.).
- `DiagnosticsLogSource` – abstraction over the log source (in-memory buffer, Loki, etc.).
- `DiagnosticsMetricsSource` – abstraction over telemetry metrics.
- `DiagnosticsAggregator` – core logic to calculate a `DiagnosticsSnapshot` from the two sources.

A typical usage pattern:

- Application registers logger, telemetry, and diagnostics helper blobs in its container.
- When a client (MCP tool or HTTP service) requests diagnostics, it resolves `DiagnosticsAggregator` and calls a method like:
  - `calculateSnapshot(options?: Partial<DiagnosticsWindowConfig>): DiagnosticsSnapshot`.

### MCP tool: summarized diagnostics

In `@speajus/diblob-mcp`, we add a diagnostics-oriented tool, for example:

- Tool name (illustrative): `diagnostics_summarize_recent_activity`.
- Input schema:
  - `windowSeconds` (default e.g., 300).
  - Optional filters: `blobNames`, `severityThreshold`, `maxBlobs`, `maxEventsPerBlob`.
- Output schema:
  - `snapshot: DiagnosticsSnapshot` (structured JSON for programmatic use).
  - `summaryText: string` – a compressed, LLM-friendly textual summary.

The MCP implementation will:

1. Resolve `DiagnosticsAggregator` from a container dedicated to the MCP server.
2. Call `calculateSnapshot` using the requested window and filters.
3. Produce a textual `summaryText` that:
   - Highlights blobs with the worst health.
   - Mentions top errors and metrics regressions.
   - Stays within a conservative token budget.

LLMs can then chain this tool with further actions (e.g., requesting more detail for a specific blob) without needing raw Loki/OTel access.

### Service API for human-facing clients

We expose the same diagnostics through a small service API, intended to be implemented with Connect/HTTP in an example service:

- `DiagnosticsService.Snapshot`
  - Request: `{ windowSeconds?: number; blobNames?: string[] }`.
  - Response: `{ snapshot: DiagnosticsSnapshot }`.
- `DiagnosticsService.SummaryText`
  - Request: same as `Snapshot`.
  - Response: `{ summaryText: string }`.

The service implementation reuses the **same** `DiagnosticsAggregator` blob as the MCP tool. This keeps logic centralized and avoids drift between LLM- and UI-facing views.

### Example frontend

We will provide an example frontend (likely a small Svelte app) that:

- Calls `DiagnosticsService.Snapshot` on demand (and optionally on an interval) to fetch the latest `DiagnosticsSnapshot`.
- Renders blob-centric cards showing:
  - Health status and key metrics.
  - Counts of recent errors and warnings.
  - A short list of recent error messages.
- Provides a "Copy for LLM" action that requests `DiagnosticsService.SummaryText` and copies it to the clipboard.

This example is not a replacement for diblob-visualizer. Instead, it is a focused incident triage panel optimized for AI-assisted workflows.

### Interaction with existing packages

- **@speajus/diblob-logger**
  - Diagnostics depends on the logger for structured logs and severity counts.
  - We will keep Loki integration in `@speajus/diblob-logger` and add a thin adapter layer used by `DiagnosticsLogSource`.

- **@speajus/diblob-telemetry**
  - We reuse the existing telemetry hooks and metrics described in the OpenTelemetry ADR.
  - Any helper like `registerTelemetryLoggerBlobs` remains in `@speajus/diblob-telemetry` as per prior decisions; diagnostics builds on top of it rather than duplicating instrumentation.

- **@speajus/diblob-mcp**
  - The new MCP tool lives in the MCP package and uses a container wired with logger, telemetry, and diagnostics blobs.
  - Other MCP tools can later reuse the same diagnostics blobs if they need structured health information.

## Rollout steps
1. Define the diagnostics model (`DiagnosticsSnapshot`, `BlobDiagnosticsSummary`) and configuration interfaces.
2. Implement `DiagnosticsLogSource` and `DiagnosticsMetricsSource` adapters using diblob-logger and diblob-telemetry.
3. Implement `DiagnosticsAggregator` blob and its public `calculateSnapshot` method.
4. Add the `diagnostics_summarize_recent_activity` MCP tool in `@speajus/diblob-mcp` using the aggregator.
5. Implement `DiagnosticsService` (Connect/HTTP) in an example service, reusing the same aggregator.
6. Build a small example frontend that calls the service and renders blob-centric diagnostics.
7. Add tests covering aggregation correctness and basic MCP/service behaviors.
8. Document usage in both public docs (high-level guide) and internal docs (this ADR, implementation notes).

## Open questions
- Should diagnostics support streaming/continuous updates (e.g., SSE) in addition to on-demand snapshots for UIs?
  Yes. SSE should be supported, and by default should use gRPC streaming.
- How configurable should health heuristics be (pluggable vs. fixed defaults)?
  We should provide a way to configure health heuristics, but we should also provide sensible defaults.  The defaults should be configurable via environment variables and/or a configuration file.  The configuration should be able to be overridden at runtime via a management API.  The management API should be able to be secured via JWT tokens.  The JWT token should be able to be refreshed via a refresh token.  The refresh token should have a long expiration.  The refresh token should be able to be revoked.  The management API should be able to be disabled entirely.  The management API should be able to be disabled for read-only access.  The management API should be able to be disabled for write-only access.  The management API should be able to be disabled for read-write access.
- Do we want first-class support for multi-tenant/logically separated containers, or leave that to callers via filters?
  We should support multi-tenant containers via filters.  The filters should be able to be configured via environment variables and/or a configuration file.  The configuration should be able to be overridden at runtime via a management API.  The management API should be able to be secured via JWT tokens.  The JWT token should be able to be refreshed via a refresh token.  The refresh token should have a long expiration.  The refresh token should be able to be revoked.  The management API should be able to be disabled entirely.  The management API should be able to be disabled for read-only access.  The management API should be able to be disabled for write-only access.  The management API should be able to be disabled for read-write access.
- What defaults should we use for time windows and token budgets to make LLM calls inexpensive by default?
  The time window should be configurable, but the default should be 5 minutes.  The token budget should be configurable, but the default should be 1000 tokens.  The token budget should be able to be exhausted.  When the token budget is exhausted, the response should be truncated.  The response should indicate that the token budget was exhausted.  The response should provide a summary of the data that was not included due to the exhausted token budget.

