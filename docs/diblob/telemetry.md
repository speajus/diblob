# Telemetry (OpenTelemetry)

`@speajus/diblob-telemetry` instruments diblob containers with OpenTelemetry traces and metrics.

## Install

```bash
pnpm add @speajus/diblob-telemetry
```

## Quick start

<augment_code_snippet mode="EXCERPT" path="docs/diblob/telemetry.md">
````ts
import { createContainer } from '@speajus/diblob';
import { registerTelemetryBlobs, telemetryContext } from '@speajus/diblob-telemetry';

const container = createContainer();

registerTelemetryBlobs(container, {
  serviceName: 'example',
  exporter: 'console',
  traceSampleRatio: 1.0,
});

await container.resolve(telemetryContext);
````
</augment_code_snippet>

## Configuration

- `serviceName` (string)
- `serviceVersion` (string)
- `deploymentEnvironment` (string)
- `exporter`: `otlp-http` | `console` | `none` (default `console`)
- `exporterEndpoint` (string URL; used for OTLP)
- `traceSampleRatio` (number, default 1.0)
- `enableTraces` (boolean, default true)
- `enableMetrics` (boolean, default true)
- `enablePaths` (boolean, default true — reserved for future path capture)

## Disposal

`registerTelemetryBlobs` wires a dispose hook so `container.dispose()` will shut down tracer and meter providers.
