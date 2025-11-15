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
import { test, describe } from 'node:test';
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

## Best Practices

1. **Use `setupEachTestContainer()`** for most tests to ensure complete isolation
2. **Use `setupFileScopedTestContainer()`** when you need to share expensive setup across tests
3. **Use `withBlobOverride()`** to temporarily replace dependencies without affecting other tests
4. **Configure deterministic seeds** for reproducible test runs
5. **Clear test infrastructure state** between tests when using shared containers

## Integration with Existing Code

The package follows diblob conventions with separate blob definitions, implementations, and registration helpers. It integrates seamlessly with existing diblob applications and can be used alongside production containers.

## License

MIT
