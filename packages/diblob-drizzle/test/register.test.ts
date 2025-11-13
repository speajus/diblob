import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createContainer } from '@speajus/diblob';
import {
  type DatabaseConfig,
  databaseClient,
  databaseConfig,
} from '../src/blobs.js';
import { registerDrizzleBlobs } from '../src/register.js';

// Basic sanity check that registerDrizzleBlobs wires up the database
// configuration and client in the container.
test('registerDrizzleBlobs registers config and database client', async () => {
  const container = createContainer();

  const config: DatabaseConfig = {
    driver: 'sqlite',
    connection: ':memory:',
    logging: false,
  };

  registerDrizzleBlobs(container, config);

  const resolvedConfig = await container.resolve(databaseConfig);
  assert.equal(resolvedConfig.driver, 'sqlite');
  assert.equal(resolvedConfig.connection, ':memory:');

  const client = await container.resolve(databaseClient);
  assert.ok(client, 'expected a database client instance');
  assert.equal(typeof client.initialize, 'function');
});

