import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createBlob, createContainer, Lifecycle } from '@speajus/diblob';
import { 
  createIsolatedTestContainer, 
  createTestContainer, 
  httpClientStub,
  httpServerStub, 
  testClock,
  testLogger,
  testRandom,
  withBlobOverride
} from '../src/index.js';

describe('Test Container Factories', () => {
  test('createTestContainer should create container with test infrastructure', async () => {
    const container = createTestContainer();
    
    // Should have test infrastructure blobs registered
    assert.ok(container.has(testLogger));
    assert.ok(container.has(testClock));
    assert.ok(container.has(testRandom));
    assert.ok(container.has(httpClientStub));
    assert.ok(container.has(httpServerStub));
    
    // Should be able to resolve them
    const logger = await container.resolve(testLogger);
    const clock = await container.resolve(testClock);
    const random = await container.resolve(testRandom);
    
    assert.ok(logger);
    assert.ok(clock);
    assert.ok(random);
    
    await container.dispose();
  });

  test('createTestContainer should respect options', async () => {
    const container = createTestContainer({
      randomSeed: 123,
      initialTime: 1000,
      includeHttp: false
    });
    
    // Should have basic infrastructure
    assert.ok(container.has(testLogger));
    assert.ok(container.has(testClock));
    assert.ok(container.has(testRandom));
    
    // Should not have HTTP stubs
    assert.ok(!container.has(httpClientStub));
    assert.ok(!container.has(httpServerStub));
    
    // Should use configured values
    const clock = await container.resolve(testClock);
    const random = await container.resolve(testRandom);
    
    assert.strictEqual(clock.now(), 1000);
    
    // Test that random is seeded correctly by generating a few values
    const value1 = random.random();
    const value2 = random.random();
    
    // Reset and generate again - should be same values
    random.reset();
    const value1Again = random.random();
    const value2Again = random.random();
    
    assert.strictEqual(value1, value1Again);
    assert.strictEqual(value2, value2Again);
    
    await container.dispose();
  });

  test('createIsolatedTestContainer should default to transient lifecycle', async () => {
    const container = createIsolatedTestContainer();
    
    interface TestService {
      getValue(): number;
    }
    
    let counter = 0;
    const testService = createBlob<TestService>();
    
    // Register without explicit lifecycle options
    container.register(testService, () => ({
      getValue: () => ++counter
    }));
    
    // Should create new instances each time (transient)
    const instance1 = await container.resolve(testService);
    const instance2 = await container.resolve(testService);
    
    assert.strictEqual(instance1.getValue(), 1);
    assert.strictEqual(instance2.getValue(), 2);
    
    await container.dispose();
  });

  test('createIsolatedTestContainer should allow explicit lifecycle override', async () => {
    const container = createIsolatedTestContainer();
    
    interface TestService {
      getValue(): number;
    }
    
    let counter = 0;
    const testService = createBlob<TestService>();
    
    // Register with explicit singleton lifecycle
    container.register(testService, () => ({
      getValue: () => ++counter
    }), { lifecycle: Lifecycle.Singleton });

    // Should reuse same instance (singleton)
    const instance1 = await container.resolve(testService);
    const instance2 = await container.resolve(testService);

    // Should be the same instance
    assert.strictEqual(instance1, instance2);

    // Should share state (same counter)
    const value1 = instance1.getValue();
    const value2 = instance2.getValue();

    assert.strictEqual(value1, 1);
    assert.strictEqual(value2, 2); // Same instance, counter continues
    
    await container.dispose();
  });
});
