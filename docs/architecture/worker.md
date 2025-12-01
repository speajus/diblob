# Background worker / job runner pattern

This pattern describes a long-running process that executes jobs from a queue or scheduler, using per-job child containers for isolation and telemetry.

## When to use this pattern

Use this pattern when you need to:

- Run scheduled tasks (cron-style).
- Consume jobs from a queue.
- Perform work that is too slow or unreliable to run in an interactive request.

The worker reuses the same infrastructure wiring as your HTTP/Connect service but has a different event loop.

## Container layout

The high-level shape is:

- **Root worker container** (process scoped):
  - Configuration for worker behavior (schedules, concurrency limits, queue endpoints).
  - Logger configured with a service name that distinguishes the worker from the API.
  - Telemetry exporter and metrics (e.g. jobs processed, failures).
  - Database or queue clients.
  - Any long-lived services shared across jobs.

- **Per-job child container**:
  - Job context blob (jobId, workspaceId, trigger type).
  - Job-specific settings or feature flags.
  - Any stateful services that should not be reused across jobs.

Job handlers only depend on blobs and do not know whether their dependencies are job-scoped or process-scoped.

## Job lifecycle

A typical job execution looks like:

1. The worker process starts and creates the **root worker container**.
2. The worker subscribes to a queue or scheduler using blobs from the root container.
3. When a job is ready, the worker creates a **child container** for that job.
4. The job context blob is populated with identifiers and metadata.
5. The job handler runs, resolving its dependencies from the job container.
6. On success or failure, the job container is disposed, releasing any job-scoped resources.

This layout prevents cross-job state leaks and makes it easy to add structured logging and telemetry for each job.

## Cross-cutting concerns

Common cross-cutting pieces in the worker:

- **Configuration** – worker configuration via [`@speajus/diblob-config`](/diblob/config).
- **Logging** – structured logs via [`@speajus/diblob-logger`](/diblob/logger), including jobId and workspaceId.
- **Telemetry** – spans and metrics via [`@speajus/diblob-telemetry`](/diblob/telemetry), such as job durations and error rates.
- **Async context** – if desired, job context exposed via [`@speajus/diblob-async-context`](/diblob/async-context).
- **Visualizer / diagnostics** – optional visualization via [`@speajus/diblob-visualizer`](/visualizer/) and [diagnostics](/diblob/diagnostics).

Unlike the HTTP service, workers often run without user-facing auth, but they still benefit from consistent IDs and context fields for debugging.

## Related docs

- [Architecture overview](/architecture/overview)
- [HTTP / Connect / gRPC service pattern](/architecture/http-grpc-service)
