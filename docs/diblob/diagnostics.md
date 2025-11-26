# @speajus/diblob-diagnostics – LLM-driven debugging helper

The `@speajus/diblob-diagnostics` package provides a reusable "diagnostics helper" for blob-centric debugging. It aggregates **recent logs and metrics per blob**, and surfaces that as a compact snapshot suitable for UIs, operators, and LLMs.

It is designed to work alongside:

- `@speajus/diblob-logger` – structured logging, often exported to Loki.
- `@speajus/diblob-telemetry` – OpenTelemetry-based metrics and traces.
- `@speajus/diblob-mcp` – Model Context Protocol server for LLM tools.

---

## Concepts

### Diagnostics events

Code records lightweight `DiagnosticsEvent` objects whenever interesting work happens:

- **blobName** – which blob performed the work (for example `userService`).
- **message** – short description (for example `getUser completed`).
- **level** – `debug | info | warn | error`.
- **outcome** – `success | error | unknown`.
- **timestamp** and optional **durationMs**.
- **context** – small JSON object with extra fields (user id, request id, etc.).

Events are stored in an in-memory ring buffer and also logged through `@speajus/diblob-logger` for long term storage.

### Recorder and aggregator

The package exposes two main blobs:

- **`diagnosticsRecorder`** – records events and lets callers fetch recent events.
- **`diagnosticsAggregator`** – turns recent events into a `DiagnosticsSnapshot`:
  - Per-blob `BlobDiagnosticsSummary` (counts, durations, last error, health).
  - Overall snapshot metadata (`generatedAt`, `windowSeconds`, `totalEvents`).

The aggregator classifies each blob as `healthy`, `degraded`, or `failing` based on error rates and severity, and can wrap its work in an OpenTelemetry span when telemetry is registered.

---

## Registering diagnostics in a container

The helper provides a single registration function:

```ts
import { createContainer } from '@speajus/diblob';
import { registerDiagnosticsBlobs } from '@speajus/diblob-diagnostics';

const container = createContainer();

registerDiagnosticsBlobs(container, {
  windowSeconds: 300,
  maxBlobs: 32,
  maxEventsPerBlob: 20,
  severityThreshold: 'info',
});
```

This registers:

- `diagnosticsWindowConfig` – window and aggregation settings.
- `diagnosticsRecorder` – singleton recorder that also logs via `diblob-logger`.
- `diagnosticsAggregator` – singleton aggregator that uses the recorder + config.

If `@speajus/diblob-telemetry` is also registered, the aggregator will emit a span when calculating snapshots; otherwise it runs without telemetry.

---

## Recording diagnostics from a blob

Typical usage inside a service blob (for example, the gRPC `UserServiceImpl`):

```ts
import { diagnosticsRecorder, type DiagnosticsRecorder } from '@speajus/diblob-diagnostics';

class UserServiceImpl {
  constructor(private readonly diagnostics: DiagnosticsRecorder = diagnosticsRecorder) {}

  async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    const startedAt = Date.now();
    try {
      // ... business logic ...
      const durationMs = Date.now() - startedAt;
      this.diagnostics.record({
        blobName: 'userService',
        message: 'getUser completed',
        level: 'info',
        outcome: 'success',
        durationMs,
        context: { userId: request.id },
      });
      return response;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      this.diagnostics.record({
        blobName: 'userService',
        message: 'getUser failed',
        level: 'error',
        outcome: 'error',
        durationMs,
        context: { userId: request.id, errorMessage: String(error) },
      });
      throw error;
    }
  }
}
```

You can call `diagnosticsRecorder.record` from any blob that wants to participate in diagnostics.

---

## LLM-facing integrations

Once diagnostics blobs are registered, several integrations can consume the snapshots.

### MCP tool: `diagnostics_summarize_recent_activity`

The `@speajus/diblob-mcp` package exposes a tool named `diagnostics_summarize_recent_activity` when the container has `diagnosticsAggregator` registered.

That tool:

- Accepts options like `windowSeconds`, `maxBlobs`, and `severityThreshold`.
- Calls `calculateSnapshot` on the aggregator.
- Returns:
  - A short **text summary** describing top blobs and their health.
  - A **JSON snapshot** suitable for programmatic use.

This is ideal for LLM-driven incident helpers that need a concise view of "what looks broken" across blobs.

### DiagnosticsService on example-grpc-server

The `examples/example-grpc-server` package hosts a Buf + Connect `DiagnosticsService`:

- Request: `GetDiagnosticsSnapshotRequest` (window, max blobs, severity).
- Response: `GetDiagnosticsSnapshotResponse` with:
  - Overall metadata and summary text.
  - A list of `DiagnosticsBlobSummary` objects per blob.

This service is implemented using `diagnosticsAggregator` and the same snapshot model used by the MCP tool.

### Example diagnostics frontend

The `examples/example-diagnostics-web` package is a Svelte 5 app that:

- Calls `DiagnosticsService` over HTTP using Connect-Web.
- Lets you tweak window / max blobs / severity.
- Renders the summary text and per-blob health cards and counts.

You can run both examples together to get a full loop:

- Operators and UIs use the web dashboard.
- LLM tools call the MCP diagnostics tool.
- Both are powered by the same diagnostics events recorded from your blobs.

