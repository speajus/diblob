/**
 * Container lifecycle tests using diblob-testing
 * 
 * These tests demonstrate testing container setup, registration, and disposal
 * using diblob-testing utilities.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createContainer } from '@speajus/diblob';
import { registerGrpcBlobs } from '@speajus/diblob-connect';
import { createTestContainer, setupEachTestContainer, testLogger } from '@speajus/diblob-testing';
import { database, sqlite } from '../drizzle.js';
import { registerDrizzleBlobs, registerUserService } from '../register.js';
import { userService } from '../user-service.js';

describe('Container Lifecycle Tests', () => {
  test('should create a test container with infrastructure', async () => {
    const container = createTestContainer();
    
    // Verify test infrastructure is available
    const log = await container.resolve(testLogger);
    assert.ok(log);
    assert.strictEqual(typeof log.info, 'function');
    assert.strictEqual(typeof log.getRecords, 'function');
    
    await container.dispose();
  });

  test('should register and resolve database blobs', async () => {
    const container = createContainer();
    registerDrizzleBlobs(container, ':memory:');
    
    // Verify database blobs are registered
    const db = await container.resolve(database);
    assert.ok(db);
    assert.ok(db.query);
    
    const sqliteDb = await container.resolve(sqlite);
    assert.ok(sqliteDb);
    assert.strictEqual(typeof sqliteDb.close, 'function');
    
    await container.dispose();
  });

  test('should register and resolve user service', async () => {
    const container = createContainer();
    registerDrizzleBlobs(container, ':memory:');
    registerGrpcBlobs(container, { host: '0.0.0.0', port: 50051 });
    await registerUserService(container);

    // Verify user service is registered
    const service = await container.resolve(userService);
    assert.ok(service);
    assert.strictEqual(typeof service.createUser, 'function');
    assert.strictEqual(typeof service.getUser, 'function');
    assert.strictEqual(typeof service.listUsers, 'function');
    assert.strictEqual(typeof service.updateUser, 'function');
    assert.strictEqual(typeof service.deleteUser, 'function');

    await container.dispose();
  });

  test('should properly dispose container and close database', async () => {
    const container = createContainer();
    registerDrizzleBlobs(container, ':memory:');
    
    const sqliteDb = await container.resolve(sqlite);
    assert.ok(sqliteDb.open, 'Database should be open');
    
    // Dispose container
    await container.dispose();
    
    // Verify database is closed
    assert.ok(!sqliteDb.open, 'Database should be closed after dispose');
  });

  test('should handle multiple registrations in same container', async () => {
    const container = createContainer();
    registerDrizzleBlobs(container, ':memory:');
    registerGrpcBlobs(container, { host: '0.0.0.0', port: 50052 });
    registerUserService(container);

    // Resolve multiple blobs
    const db = await container.resolve(database);
    const service = await container.resolve(userService);
    const sqliteDb = await container.resolve(sqlite);

    assert.ok(db);
    assert.ok(service);
    assert.ok(sqliteDb);

    await container.dispose();
  });
});

describe('Container Lifecycle with setupEachTestContainer', () => {
  const { getContainer } = setupEachTestContainer();

  test('should provide fresh container for each test', async () => {
    const container = getContainer();
    const log = await container.resolve(testLogger);
    
    log.info('Test message 1');
    const records = log.getRecords();
    
    assert.strictEqual(records.length, 1);
    assert.strictEqual(records[0].message, 'Test message 1');
  });

  test('should have clean state in new test', async () => {
    const container = getContainer();
    const log = await container.resolve(testLogger);
    
    // This should be a fresh logger with no previous records
    const records = log.getRecords();
    assert.strictEqual(records.length, 0);
    
    log.info('Test message 2');
    assert.strictEqual(log.getRecords().length, 1);
  });
});


