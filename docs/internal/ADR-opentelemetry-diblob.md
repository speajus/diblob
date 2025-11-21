# ADR: OpenTelemetry instrumentation for diblob

## Status
Accepted

## Context / Problem
- We need visibility into container/blob resolution behavior (frequency, latency, dependency paths, errors, lifecycle, disposal) across packages (core, testing, visualizer, example-grpc-server).
- Instrumentation should be opt-in, low-overhead, and align with diblob architecture (blobs in one file, implementations + registration separated, container dispose cascades, Winston logger preference, Connect/Buf gRPC preference, SSE-only visualizer).
- Telemetry must support both local dev (console/Prometheus) and OTLP backends (Tempo, Honeycomb, etc.).

## Goals
- Metrics: counters and histograms for resolves/disposals; top-path summarization.
- Traces: spans for container and blob resolutions with attributes for path, cache-hit, result, error.
- Hooks: non-invasive integration via container lifecycle/resolve/dispose hooks; no behavior changes when disabled.
- Compatibility: works with example-grpc-server (Connect) and diblob-visualizer SSE.
- Configurable: sampling, exporter choice, path-capture toggle, resource attrs.

## Non-goals (for initial phase)
- Automatic dependency graph visualization beyond emitted events/metrics.
- Production-grade adaptive sampling logic (basic ratio only).
- Cross-process baggage propagation (only standard trace context).

## Decision
Implement a telemetry module (package or submodule) that exposes registration functions to instrument a container via hooks, emitting OpenTelemetry metrics and traces, plus optional SSE events for the visualizer. Instrument example-grpc-server with request-scoped child containers and OTLP/console exporters.

## Proposed design
- Provide `registerTelemetryBlobs(container, options)` to register:
  - `TelemetryContext` blob exposing meter, tracer, resource, exporter state.
  - Resolve/Dispose hooks that wrap container operations and emit spans/metrics.
  - Optional SSE emitter for diblob-visualizer.
- Container hooks:
  - On container create: counter + span event.
  - On resolve start/stop: span (child), histogram ms, counter (hit/miss/error), attrs: blob.name, container.id, depth, from.cache, result, path (compressed string), resolution.kind (singleton/factory/child), duration.ms.
  - On resolve error: record exception + error counter.
  - On dispose: counters + histogram; span or event per blob; cascaded disposal observed via events.
- Tracing model:
  - Parent span per request/task (e.g., gRPC middleware); resolve spans are children.
  - Sampling: parent-based + ratio (default 1.0 for dev, configurable).
- Metrics model:
  - Counters: `diblob.blob_resolutions`, `diblob.blob_resolution_errors`, `diblob.container_creations`, `diblob.container_disposals`, `diblob.blob_disposals`.
  - Histograms: `diblob.blob_resolution_duration_ms`, `diblob.blob_disposal_duration_ms`.
  - Top-paths: in-memory ring buffer summarizing `(path, count, p95)`; exportable via SSE/periodic log.
- Exporters/config:
  - OTLP HTTP (4318) and gRPC (4317) supported; console exporter for dev; optional Prometheus pull if needed.
  - Resource attrs: service.name/version, deployment.environment, process.pid, container.id (synthetic), request.id when available.
  - Config toggles: enable traces, enable metrics, enable path capture, sample ratio, exporter type/endpoint, auth headers.

## Example API (illustrative)
<augment_code_snippet path="docs/internal/ADR-opentelemetry-diblob.md" mode="EXCERPT">
````ts
const telemetry = registerTelemetryBlobs(container, {
  serviceName: 'example-grpc-server',
  exporter: 'otlp-http',
  traceSampleRatio: 0.2,
  enablePaths: true,
});
````
</augment_code_snippet>

## gRPC (Connect) integration plan
- Add Connect middleware to start a `rpc.server` span with incoming context; create per-request child container; inject span context into the container’s hook context so resolve spans are children.
- Propagate trace context in response metadata; include request id for correlating SSE visualizer streams.
- Expose OTLP endpoint config via env (e.g., `OTEL_EXPORTER_OTLP_ENDPOINT`).

## Visualizer (SSE) integration
- Emit SSE events for resolution/disposal: `{ts, requestId?, containerId, blob, durationMs, fromCache, depth, path}`.
- Client renders timeline/waterfall, top paths, and slowest blobs. SSE-only (per memory rule).

## Overhead / safety
- Default no-op unless registered.
- Low-cost timestamps + optional path string; path capture can be disabled.
- Sampling controls for traces; metrics aggregation via OTel SDK (delta/explicit bucket).

## Alternatives considered
- Wrap each blob factory manually (too invasive).
- Custom tracing without OTel (rejected: ecosystem integration loss).
- Global monkeypatch of container resolve (rejected: brittle; prefer hook API).

## Rollout steps
1) Implement telemetry hooks module + registerTelemetryBlobs.
2) Wire into example-grpc-server with console exporter default, OTLP opt-in.
3) Add SSE emission for visualizer, gated by option.
4) Add docs: user-facing guide in `docs/` and internal notes here; add tests covering counters, histograms, spans, and SSE emission.

## Open questions
- Do we want Prometheus pull as first-class or defer to OTLP + Prom scrape via collector?
- How large should the in-memory top-path buffer be, and should it be per-container or global?
- Should we emit blob dependency edges as metrics for offline graphing (e.g., `depends_on` pairs)?

