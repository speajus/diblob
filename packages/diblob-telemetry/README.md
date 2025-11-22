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