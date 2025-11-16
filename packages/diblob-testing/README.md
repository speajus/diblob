# @speajus/diblob-testing

Testing utilities for diblob dependency injection containers.

## Overview

`@speajus/diblob-testing` provides comprehensive testing utilities for applications using the diblob dependency injection framework. It includes test container factories, blob override utilities, fake infrastructure implementations, and seamless integration with Node.js's built-in test runner.

## Installation

```bash
pnpm add -D @speajus/diblob-testing
```

## Quick Start

```typescript
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { setupEachTestContainer, testLogger } from '@speajus/diblob-testing';

describe('My Service Tests', () => {
  const { getContainer } = setupEachTestContainer();

  test('should log messages', async () => {
    const container = getContainer();
    const logger = await container.resolve(testLogger);

    logger.info('Test message');

    const records = logger.getRecords();
    assert.strictEqual(records.length, 1);
    assert.strictEqual(records[0].message, 'Test message');
  });
});
```

## Core Features

### Test Container Factories

- **`createTestContainer(options?)`** - Creates a container pre-configured with test infrastructure
- **`createIsolatedTestContainer(options?)`** - Creates a container that defaults all registrations to transient lifecycle for better test isolation

### Blob Override Utilities

- **`withBlobOverride(container, blob, implementation, testFn)`** - Safely override a blob implementation for a single test, with automatic cleanup

### Fake Infrastructure Blobs

- **`testLogger`** - In-memory logger that captures log records for verification
- **`testClock`** - Controllable clock for testing time-dependent code
- **`testRandom`** - Deterministic random number generator for reproducible tests
- **`httpClientStub`** - HTTP client stub with request recording and response queuing
- **`httpServerStub`** - HTTP server stub with configurable request handlers

### node:test Integration

- **`setupFileScopedTestContainer(options?)`** - Creates a shared container for all tests in a file
- **`setupEachTestContainer(options?)`** - Creates fresh isolated containers for each test

## API Reference

### Container Options

```typescript
interface TestContainerOptions {
  randomSeed?: number;      // Seed for deterministic RNG (default: 42)
  initialTime?: number;     // Initial timestamp for test clock (default: 0)
  includeHttp?: boolean;    // Include HTTP stubs (default: true)
}
```

### Test Infrastructure Examples

#### Logger Testing
```typescript
const container = createTestContainer();
const logger = await container.resolve(testLogger);

logger.info('Hello', { user: 'test' });
logger.error('Oops');

const records = logger.getRecords();
// Verify log messages, levels, metadata, timestamps
```

#### Clock Testing
```typescript
const container = createTestContainer({ initialTime: 1000 });
const clock = await container.resolve(testClock);

assert.strictEqual(clock.now(), 1000);
clock.advanceBy(500);
assert.strictEqual(clock.now(), 1500);
```

#### HTTP Testing
```typescript
const container = createTestContainer();
const client = await container.resolve(httpClientStub);

// Queue responses
client.queueResponse(new Response('{"status": "ok"}'));

// Make request
const response = await client.fetch('/api/status');
const data = await response.json();

// Verify requests
const requests = client.getSentRequests();
assert.strictEqual(requests[0].url, '/api/status');
```

## Real-World Testing Patterns

### Pattern 1: Testing with Real In-Memory Databases

Instead of mocking database operations, use real in-memory databases for more accurate testing:

```typescript
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createTestContainer, withBlobOverride } from '@speajus/diblob-testing';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './db/schema.js';
import { database } from './drizzle.js';
import { UserServiceImpl } from './user-service.js';

describe('UserService Tests', () => {
  // Helper to create a test database with schema
  const createTestDatabase = () => {
    const sqliteDb = new Database(':memory:');

    // Create the schema
    sqliteDb.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
      )
    `);

    const db = drizzle(sqliteDb, { schema });
    return { sqliteDb, db };
  };

  test('should create a user successfully', async () => {
    const container = createTestContainer();
    const { sqliteDb, db } = createTestDatabase();

    try {
      await withBlobOverride(container, database, db, async () => {
        const service = new UserServiceImpl(database);

        const user = await service.createUser({
          name: 'John Doe',
          email: 'john@example.com'
        });

        assert.strictEqual(user.name, 'John Doe');
        assert.strictEqual(user.email, 'john@example.com');
      });
    } finally {
      sqliteDb.close();
    }
  });
});
```

### Pattern 2: Integration Tests with Full Container Setup

Test complete workflows with all dependencies registered:

```typescript
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createContainer } from '@speajus/diblob';
import { registerGrpcBlobs } from '@speajus/diblob-connect';
import { setupEachTestContainer } from '@speajus/diblob-testing';
import { registerDrizzleBlobs, registerUserService } from './register.js';
import { userService } from './user-service.js';
import { sqlite } from './drizzle.js';

describe('gRPC Service Integration Tests', () => {
  const { getContainer } = setupEachTestContainer();

  // Helper to create database schema
  async function createSchema(container) {
    const db = await container.resolve(sqlite);
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
      )
    `);
  }

  test('should create and retrieve a user through service', async () => {
    const container = getContainer();
    registerDrizzleBlobs(container, ':memory:');
    await createSchema(container);
    registerGrpcBlobs(container, { host: '0.0.0.0', port: 50053 });
    registerUserService(container);

    const service = await container.resolve(userService);

    // Create a user
    const createResponse = await service.createUser({
      name: 'Integration Test User',
      email: 'integration@test.com'
    });

    assert.ok(createResponse.user);
    assert.strictEqual(createResponse.user.name, 'Integration Test User');

    // Retrieve the user
    const getResponse = await service.getUser({
      id: createResponse.user.id
    });

    assert.strictEqual(getResponse.user.id, createResponse.user.id);
    assert.strictEqual(getResponse.user.name, 'Integration Test User');
  });
});
```

### Pattern 3: Container Lifecycle Testing

Test that your container setup, registration, and disposal work correctly:

```typescript
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createContainer } from '@speajus/diblob';
import { registerDrizzleBlobs, registerUserService } from './register.js';
import { database, sqlite } from './drizzle.js';
import { userService } from './user-service.js';

describe('Container Lifecycle Tests', () => {
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
});
```

### Pattern 4: Blob Override for Dependency Injection

Override specific dependencies without affecting the entire container:

```typescript
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTestContainer, withBlobOverride } from '@speajus/diblob-testing';
import { exampleWebConfig } from './diblob/blobs.js';
import { UserGateway } from './user-gateway.js';

test('should use test configuration', async () => {
  const container = createTestContainer();

  const testConfig = {
    apiBaseUrl: 'http://test-server:8080',
    visualizerEventsUrl: 'http://test-visualizer:3001/events'
  };

  await withBlobOverride(container, exampleWebConfig, testConfig, async () => {
    const gateway = await container.resolve(UserGateway);
    // Gateway will use test configuration
    const users = await gateway.fetchUsers();
    assert.ok(Array.isArray(users));
  });
});
```

## Best Practices

1. **Use real in-memory databases** instead of mocks for database testing - provides more accurate behavior and catches integration issues
2. **Use `setupEachTestContainer()`** for most tests to ensure complete isolation between tests
3. **Use `setupFileScopedTestContainer()`** when you need to share expensive setup across tests (use sparingly)
4. **Use `withBlobOverride()`** to temporarily replace dependencies without affecting other tests
5. **Create helper functions** for common setup like database schema creation
6. **Always clean up resources** in `finally` blocks when using external resources like database connections
7. **Test container lifecycle** to ensure proper registration and disposal of resources
8. **Configure deterministic seeds** for reproducible test runs with `testRandom` and `testClock`

## Integration with Existing Code

The package follows diblob conventions with separate blob definitions, implementations, and registration helpers:

- **Blob definitions** in separate files (e.g., `drizzle.ts`, `blobs.ts`)
- **Implementations** in implementation files (e.g., `user-service.ts`)
- **Registration functions** that accept a container parameter (e.g., `registerDrizzleBlobs(container)`)

This pattern integrates seamlessly with existing diblob applications and can be used alongside production containers.

## Examples

See the following examples for complete implementations:

- **`examples/example-grpc-server`** - Comprehensive testing of a gRPC server with Drizzle ORM
  - Unit tests with in-memory databases
  - Integration tests with full container setup
  - Container lifecycle tests
- **`examples/example-web-svelte`** - Testing Svelte web applications with diblob

## License

MIT
