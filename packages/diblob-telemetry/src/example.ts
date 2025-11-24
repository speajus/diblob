import { createContainer } from '@speajus/diblob';
import { registerTelemetryBlobs, telemetryContext } from './index.js';

async function main() {
  const container = createContainer();

  registerTelemetryBlobs(container, {
    serviceName: 'example-telemetry',
    exporter: 'console',
    traceSampleRatio: 1.0,
  });

  const ctx = await container.resolve(telemetryContext);
  ctx.tracer.startActiveSpan('demo', (span) => {
    span.setAttribute('example', true);
    span.end();
  });

  await container.dispose();
}

void main();
