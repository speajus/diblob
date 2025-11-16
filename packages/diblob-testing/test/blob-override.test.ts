import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createBlob } from '@speajus/diblob';
import { createTestContainer, withBlobOverride } from '../src/index.js';

describe('Blob Override Utility', () => {
  test('withBlobOverride should override blob with direct implementation', async () => {
    const baseContainer = createTestContainer();
    
    interface TestService {
      getValue(): string;
    }
    
    const testService = createBlob<TestService>();
    
    // Register original implementation
    baseContainer.register(testService, () => ({
      getValue: () => 'original'
    }));
    
    // Test with override
    const result = await withBlobOverride(
      baseContainer,
      testService,
      { getValue: () => 'overridden' },
      async (container) => {
        const service = await container.resolve(testService);
        return service.getValue();
      }
    );
    
    assert.strictEqual(result, 'overridden');
    
    // Original container should be unchanged
    const originalService = await baseContainer.resolve(testService);
    assert.strictEqual(originalService.getValue(), 'original');
    
    await baseContainer.dispose();
  });

  test('withBlobOverride should override blob with factory function', async () => {
    const baseContainer = createTestContainer();
    
    interface TestService {
      getValue(): string;
    }
    
    const testService = createBlob<TestService>();
    
    // Register original implementation
    baseContainer.register(testService, () => ({
      getValue: () => 'original'
    }));
    
    // Test with factory override
    const result = await withBlobOverride(
      baseContainer,
      testService,
      () => ({ getValue: () => 'factory-overridden' }),
      async (container) => {
        const service = await container.resolve(testService);
        return service.getValue();
      }
    );
    
    assert.strictEqual(result, 'factory-overridden');
    
    await baseContainer.dispose();
  });

  test('withBlobOverride should handle async factory functions', async () => {
    const baseContainer = createTestContainer();
    
    interface TestService {
      getValue(): string;
    }
    
    const testService = createBlob<TestService>();
    
    // Register original implementation
    baseContainer.register(testService, () => ({
      getValue: () => 'original'
    }));
    
    // Test with async factory override
    const result = await withBlobOverride(
      baseContainer,
      testService,
      async () => {
        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 1));
        return { getValue: () => 'async-overridden' };
      },
      async (container) => {
        const service = await container.resolve(testService);
        return service.getValue();
      }
    );
    
    assert.strictEqual(result, 'async-overridden');
    
    await baseContainer.dispose();
  });

  test('withBlobOverride should clean up child container on error', async () => {
    const baseContainer = createTestContainer();
    
    interface TestService {
      getValue(): string;
    }
    
    const testService = createBlob<TestService>();
    
    // Register original implementation
    baseContainer.register(testService, () => ({
      getValue: () => 'original'
    }));
    
    // Test that error is propagated and cleanup happens
    await assert.rejects(
      async () => {
        await withBlobOverride(
          baseContainer,
          testService,
          { getValue: () => 'overridden' },
          async () => {
            throw new Error('Test error');
          }
        );
      },
      { message: 'Test error' }
    );
    
    // Original container should still work
    const originalService = await baseContainer.resolve(testService);
    assert.strictEqual(originalService.getValue(), 'original');
    
    await baseContainer.dispose();
  });

  test('withBlobOverride should inherit other blobs from parent', async () => {
    const baseContainer = createTestContainer();
    
    interface ServiceA {
      getValue(): string;
    }
    
    interface ServiceB {
      getDependentValue(a: ServiceA): string;
    }
    
    const serviceA = createBlob<ServiceA>();
    const serviceB = createBlob<ServiceB>();
    
    // Register both services in base container
    baseContainer.register(serviceA, () => ({
      getValue: () => 'original-a'
    }));
    
    baseContainer.register(serviceB, (_a: ServiceA) => ({
      getDependentValue: (a: ServiceA) => `dependent-${a.getValue()}`
    }), serviceA);
    
    // Override only serviceA
    const result = await withBlobOverride(
      baseContainer,
      serviceA,
      { getValue: () => 'overridden-a' },
      async (container) => {
        const b = await container.resolve(serviceB);
        const a = await container.resolve(serviceA);
        return b.getDependentValue(a);
      }
    );
    
    assert.strictEqual(result, 'dependent-overridden-a');
    
    await baseContainer.dispose();
  });
});
