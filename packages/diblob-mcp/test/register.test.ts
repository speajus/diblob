import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createContainer } from '@speajus/diblob';
import { registerMcpBlobs } from '../src/register.js';
import { mcpServerConfig, containerIntrospector } from '../src/blobs.js';

// Verify registerMcpBlobs registers config and container introspector
// against a real diblob Container using the provided configuration.
test('registerMcpBlobs registers config and introspector', async () => {
  const container = createContainer();

  registerMcpBlobs(container, {
    name: 'test-mcp',
    version: '1.2.3',
    description: 'Test MCP server',
  });

  const config = await container.resolve(mcpServerConfig);
  assert.equal(config.name, 'test-mcp');
  assert.equal(config.version, '1.2.3');
  assert.equal(config.description, 'Test MCP server');

  const introspector = await container.resolve(containerIntrospector);
  assert.ok(introspector, 'expected a container introspector instance');

  const blobs = await introspector.listBlobs();
  assert.ok(Array.isArray(blobs), 'listBlobs should return an array');
});

