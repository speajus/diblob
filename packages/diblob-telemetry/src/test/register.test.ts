import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createContainer } from '@speajus/diblob';
import { registerTelemetryBlobs, telemetryConfig, telemetryContext } from '../index.js';

describe('registerTelemetryBlobs', () => {
  let container: ReturnType<typeof createContainer>;

  beforeEach(() => {
    container = createContainer();
  });

  afterEach(async () => {
    await container.dispose();
  });

  it('registers config and context singletons', async () => {
    registerTelemetryBlobs(container, { serviceName: 'test-svc' });

    const cfg = await container.resolve(telemetryConfig);
    assert.equal(cfg.serviceName, 'test-svc');

    const ctx = await container.resolve(telemetryContext);
    assert.ok(ctx.tracer, 'tracer is defined');
    assert.ok(ctx.meter, 'meter is defined');

    // ensure singleton
    const ctx2 = await container.resolve(telemetryContext);
    assert.strictEqual(ctx, ctx2);
  });

  it('disposes telemetry providers on container.dispose', async () => {
    registerTelemetryBlobs(container, { serviceName: 'dispose-test' });
    const ctx = await container.resolve(telemetryContext);

    let shutdownCalled = false;
    const original = ctx.shutdown;
    ctx.shutdown = async () => {
      shutdownCalled = true;
      await original();
    };

    await container.dispose();
    assert.equal(shutdownCalled, true);
  });
});
