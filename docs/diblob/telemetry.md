# Telemetry (OpenTelemetry)

`@speajus/diblob-telemetry` instruments diblob containers with OpenTelemetry traces and metrics.

## Install

```bash
pnpm add @speajus/diblob-telemetry
```

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

- `serviceName` (string)
- `serviceVersion` (string)
- `deploymentEnvironment` (string)
- `exporter`: `otlp-http` | `console` | `none` (default `console`)
- `exporterEndpoint` (string URL; used for OTLP)
- `traceSampleRatio` (number, default 1.0)
- `enableTraces` (boolean, default true)
- `enableMetrics` (boolean, default true)
- `enablePaths` (boolean, default true — reserved for future path capture)

## Environment & configuration integration

You can build the `TelemetryConfig` you pass to `registerTelemetryBlobs` from plain environment
variables, or via a typed config using `@speajus/diblob-config`.

**Environment variables only**

```ts
import { createContainer } from '@speajus/diblob';
import {
  registerTelemetryBlobs,
  type TelemetryConfig,
} from '@speajus/diblob-telemetry';

const container = createContainer();

const telemetryConfig: TelemetryConfig = {
  serviceName: process.env.SERVICE_NAME ?? 'example',
  serviceVersion: process.env.SERVICE_VERSION,
  deploymentEnvironment: process.env.NODE_ENV ?? 'development',
  exporter: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? 'otlp-http' : 'console',
  exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  traceSampleRatio: Number(process.env.OTEL_TRACE_SAMPLE_RATIO ?? '1.0'),
};

registerTelemetryBlobs(container, telemetryConfig);
```

**Using `@speajus/diblob-config` (Node helper)**

```ts
import { createContainer } from '@speajus/diblob';
import { registerTelemetryConfigBlob } from '@speajus/diblob-telemetry';

const container = createContainer();

registerTelemetryConfigBlob(container, {
	envPrefix: 'TELEMETRY_',
	// optional: file, cliPrefix, cliArgs, defaults, environment, env, etc.
});
```

For more about typed configuration, see
[Typed Configuration with `@speajus/diblob-config`](./config.md).

## Disposal

`registerTelemetryBlobs` wires a dispose hook so `container.dispose()` will shut down tracer and meter providers.
