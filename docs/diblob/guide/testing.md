# Testing with diblob

Testing applications built with diblob is straightforward thanks to the `@speajus/diblob-testing` package, which provides comprehensive testing utilities designed specifically for diblob containers.

## Installation

::: code-group
```bash [npm]
npm install --save-dev @speajus/diblob-testing
```

```bash [yarn]
yarn add --dev @speajus/diblob-testing
```

```bash [pnpm]
pnpm add -D @speajus/diblob-testing
```
:::

## Quick Start

The simplest way to test with diblob is using `setupEachTestContainer()` which provides a fresh, isolated container for each test:

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

## Core Testing Utilities

### Test Container Factories

**`createTestContainer(options?)`** - Creates a standard test container with fake infrastructure:

```typescript
import { createTestContainer } from '@speajus/diblob-testing';

const container = createTestContainer();
// Container comes pre-configured with testLogger, testClock, testRandom, etc.
```

**`createIsolatedTestContainer(options?)`** - Creates a container where all registrations default to `Transient` lifecycle for maximum isolation:

```typescript
import { createIsolatedTestContainer } from '@speajus/diblob-testing';

const container = createIsolatedTestContainer();
// Every resolution creates a new instance by default
```

### Blob Override Utilities

**`withBlobOverride(container, blob, implementation, testFn)`** - Temporarily override a blob for a specific test:

```typescript
import { withBlobOverride } from '@speajus/diblob-testing';

await withBlobOverride(container, database, testDb, async () => {
  // Inside this function, database resolves to testDb
  const service = await container.resolve(userService);
  // Test with the overridden database
});
// Override is automatically cleaned up
```

### node:test Integration

**`setupEachTestContainer()`** - Creates a fresh container for each test with automatic cleanup:

```typescript
const { getContainer } = setupEachTestContainer();

test('test 1', async () => {
  const container = getContainer(); // Fresh container
});

test('test 2', async () => {
  const container = getContainer(); // Different fresh container
});
```

**`setupFileScopedTestContainer()`** - Creates a shared container for all tests in a file:

```typescript
const { getContainer } = setupFileScopedTestContainer();

test('test 1', async () => {
  const container = getContainer(); // Shared container
});

test('test 2', async () => {
  const container = getContainer(); // Same container
});
```

## Fake Infrastructure

The testing package includes several fake implementations for common infrastructure:

- **`testLogger`** - In-memory logger with `getRecords()` for assertions
- **`testClock`** - Controllable clock with `setTime()` and `advance()`
- **`testRandom`** - Deterministic RNG with configurable seed
- **`httpClientStub`** - HTTP client with request recording and response queuing
- **`httpServerStub`** - HTTP server with configurable request handlers

## Real-World Testing Patterns

### Pattern 1: Testing with Real In-Memory Databases

Instead of mocking database operations, use real in-memory databases for more accurate testing:

```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

const createTestDatabase = () => {
  const sqliteDb = new Database(':memory:');
  
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

test('should create a user', async () => {
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
    });
  } finally {
    sqliteDb.close();
  }
});
```

**Benefits:**
- More accurate testing - catches real database constraints
- Type safety - no need to mock complex ORM types
- Simpler test code - no complex mock setup

See [example-grpc-server tests](https://github.com/speajus/diblob/tree/main/examples/example-grpc-server/src/tests) for complete examples.

### Pattern 2: Integration Tests with Full Container Setup

Test complete workflows with all dependencies registered:

```typescript
import { setupEachTestContainer } from '@speajus/diblob-testing';
import { registerDrizzleBlobs, registerUserService } from './register.js';

describe('User Service Integration Tests', () => {
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

  test('should create and retrieve a user', async () => {
    const container = getContainer();

    // Register all dependencies
    registerDrizzleBlobs(container, ':memory:');
    await createSchema(container);
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
  });
});
```

**Benefits:**
- Tests real integration between components
- Verifies container registration is correct
- Catches configuration issues

### Pattern 3: Container Lifecycle Testing

Test that your container setup, registration, and disposal work correctly:

```typescript
import { createContainer } from '@speajus/diblob';
import { registerDrizzleBlobs } from './register.js';

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
```

### Pattern 4: Using Test Infrastructure

The fake infrastructure blobs are useful for testing time-dependent or random behavior:

```typescript
import { testClock, testRandom } from '@speajus/diblob-testing';

test('should handle time-based logic', async () => {
  const container = createTestContainer();
  const clock = await container.resolve(testClock);

  // Set specific time
  clock.setTime(new Date('2024-01-01T00:00:00Z'));

  // Test time-dependent code
  const service = await container.resolve(myService);
  const result = await service.doSomethingTimeDependent();

  // Advance time
  clock.advance(1000 * 60 * 60); // Advance 1 hour

  const laterResult = await service.doSomethingTimeDependent();
  // Assert based on time change
});

test('should handle random behavior deterministically', async () => {
  const container = createTestContainer({ randomSeed: 12345 });
  const random = await container.resolve(testRandom);

  // Random behavior is now deterministic and reproducible
  const value1 = random.next();
  const value2 = random.next();

  // These values will be the same every test run with seed 12345
});
```

## Best Practices

1. **Use real in-memory databases** instead of mocks for database testing - provides more accurate behavior and catches integration issues

2. **Use `setupEachTestContainer()`** for most tests to ensure complete isolation between tests

3. **Use `setupFileScopedTestContainer()`** sparingly - only when you need to share expensive setup across tests

4. **Use `withBlobOverride()`** to temporarily replace dependencies without affecting other tests

5. **Create helper functions** for common setup like database schema creation

6. **Always clean up resources** in `finally` blocks when using external resources like database connections

7. **Test container lifecycle** to ensure proper registration and disposal of resources

8. **Configure deterministic seeds** for reproducible test runs with `testRandom` and `testClock`

## Test Organization

Organize your tests in a dedicated directory:

```
src/
├── tests/                    # All tests in dedicated directory
│   ├── user-service.test.ts  # Unit tests
│   ├── integration.test.ts   # Integration tests
│   └── lifecycle.test.ts     # Lifecycle tests
├── db/
│   └── schema.ts             # Database schema
├── blobs.ts                  # Blob definitions
├── register.ts               # Registration functions
└── user-service.ts           # Implementation
```

Add a test script to your `package.json`:

```json
{
  "scripts": {
    "test": "tsx --test src/tests/**/*.test.ts"
  }
}
```

## Examples

For complete working examples, see:

- **[example-grpc-server](https://github.com/speajus/diblob/tree/main/examples/example-grpc-server)** - Comprehensive testing of a gRPC server with Drizzle ORM
  - Unit tests with in-memory databases
  - Integration tests with full container setup
  - Container lifecycle tests

- **[example-web-svelte](https://github.com/speajus/diblob/tree/main/examples/example-web-svelte)** - Testing Svelte web applications with diblob

## API Reference

For detailed API documentation, see the [@speajus/diblob-testing package README](https://github.com/speajus/diblob/tree/main/packages/diblob-testing).

