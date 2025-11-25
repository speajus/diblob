# @speajus/diblob-telemetry

OpenTelemetry instrumentation for diblob containers.

## Quick start

```ts
import { createContainer } from '@speajus/diblob';
import { registerTelemetryBlobs, telemetryContext } from '@speajus/diblob-telemetry';

const container = createContainer();

registerTelemetryBlobs(container, {
  serviceName: 'example',
  exporter: 'console',
  traceSampleRatio: 1.0,
});

await container.resolve(telemetryContext);
```

## Configuration

`registerTelemetryBlobs` accepts a `TelemetryConfig` object with these fields:

- `serviceName` / `serviceVersion`
- `deploymentEnvironment`
- `exporter`: `'otlp-http' | 'console' | 'none'` (default `console`)
- `exporterEndpoint` (used when `exporter` is `otlp-http`)
- `traceSampleRatio` (defaults to `1.0`)
- `enableTraces` / `enableMetrics` / `enablePaths`

You can build this object by hand from environment variables:

```ts
import { createContainer } from '@speajus/diblob';
import {
  registerTelemetryBlobs,
  type TelemetryConfig,
} from '@speajus/diblob-telemetry';

const container = createContainer();

const telemetryConfig: TelemetryConfig = {
  serviceName: process.env.SERVICE_NAME ?? 'example',
  deploymentEnvironment: process.env.NODE_ENV ?? 'development',
  exporter: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? 'otlp-http' : 'console',
  exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  traceSampleRatio: Number(process.env.OTEL_TRACE_SAMPLE_RATIO ?? '1.0'),
};

registerTelemetryBlobs(container, telemetryConfig);
```

Or you can drive it from a typed, validated configuration using
[`@speajus/diblob-config`](../../docs/diblob/config.md).