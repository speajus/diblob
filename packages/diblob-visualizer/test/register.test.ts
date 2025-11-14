import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createContainer } from '@speajus/diblob';
import {
  registerVisualizerBlobs,
  visualizerServer,
  visualizerServerConfig,
} from '../src/server/index.js';

// Verify that registerVisualizerBlobs wires up the config blob with defaults
// and registers a visualizerServer blob in the container.
test('registerVisualizerBlobs registers config defaults and server blob', async () => {
  const container = createContainer();

  registerVisualizerBlobs(container);

  const config = await container.resolve(visualizerServerConfig);

  assert.equal(config.host, '0.0.0.0');
  assert.equal(config.port, 3001);
  assert.equal(config.cors, true);
  assert.equal(config.serveStatic, true);
  assert.equal(config.updateInterval, 1000);

  assert.equal(container.has(visualizerServer), true);
});

// Verify that user-provided configuration is merged and that the
// visualizerServer blob resolves to a concrete server instance that can
// start and stop cleanly via its lifecycle methods.
test('registerVisualizerBlobs merges provided config and resolves server', async () => {
  const container = createContainer();

  registerVisualizerBlobs(container, {
    host: '127.0.0.1',
    port: 0,
    cors: false,
    serveStatic: false,
    updateInterval: 50,
  });

  const config = await container.resolve(visualizerServerConfig);

  assert.equal(config.host, '127.0.0.1');
  assert.equal(config.port, 0);
  assert.equal(config.cors, false);
  assert.equal(config.serveStatic, false);
  assert.equal(config.updateInterval, 50);

  const server = await container.resolve(visualizerServer);

  assert.equal(typeof server.start, 'function');
  assert.equal(typeof server.stop, 'function');

  // The server will already be running due to the initialize lifecycle hook.
  // Stopping it explicitly here and disposing the container should clean up
  // any underlying HTTP server resources.
  await server.stop();
  await container.dispose();
}
);
