import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createContainer } from '@speajus/diblob';
import { grpcServerConfig, grpcServiceRegistry } from '../src/blobs.js';
import { registerGrpcBlobs } from '../src/register.js';

// Basic sanity check that registerGrpcBlobs wires up config and registry
// against a real diblob Container using the expected configuration.
test('registerGrpcBlobs registers config and service registry', async () => {
  const container = createContainer();

  registerGrpcBlobs(container, { host: '127.0.0.1', port: 50051 });

  const config = await container.resolve(grpcServerConfig);
  assert.equal(config.host, '127.0.0.1');
  assert.equal(config.port, 50051);

  const registry = await container.resolve(grpcServiceRegistry);
  assert.ok(registry, 'expected a service registry instance');
  assert.equal(typeof registry.registerService, 'function');
});
