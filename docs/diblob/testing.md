# `@speajus/diblob-testing`

Testing utilities and fake infrastructure blobs for diblob containers.

`@speajus/diblob-testing` provides:

- Test container factories.
- Blob override helpers.
- Fake infrastructure blobs (logger, clock, random, HTTP stubs).
- Helpers for Node's built-in `node:test` runner.

## Installation

```bash
pnpm add -D @speajus/diblob-testing
```

## Quick start

```ts
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

## Core features

### Test container factories

- `createTestContainer(options?)` – create a container preconfigured with test
  infrastructure.
- `createIsolatedTestContainer(options?)` – create a container where
  registrations default to transient lifecycle for better isolation.

### Blob override utilities

- `withBlobOverride(container, blob, implementation, testFn)` – temporarily
  override a blob implementation for a single test, with automatic cleanup.

### Fake infrastructure blobs

- `testLogger` – in-memory logger with `getRecords()` for assertions.
- `testClock` – controllable clock with deterministic time.
- `testRandom` – deterministic RNG for reproducible tests.
- `httpClientStub` / `httpServerStub` – HTTP stubs for request/response testing.

### node:test integration

- `setupFileScopedTestContainer(options?)` – shared container for all tests in a
  file.
- `setupEachTestContainer(options?)` – fresh container per test.

## Options

```ts
interface TestContainerOptions {
  randomSeed?: number;   // Seed for deterministic RNG (default: 42)
  initialTime?: number;  // Initial timestamp for test clock (default: 0)
  includeHttp?: boolean; // Include HTTP stubs (default: true)
}
```

## Patterns

- Prefer `setupEachTestContainer()` for most tests to avoid cross-test leaks.
- Use `withBlobOverride()` to replace dependencies for a single test without
  affecting others.
- Use real in-memory databases in combination with test containers for more
  realistic integration tests.
- Always dispose containers when you create them manually outside the helpers.

For deeper examples, see the `examples/example-grpc-server` and
`examples/example-web-svelte` directories in the repository.

