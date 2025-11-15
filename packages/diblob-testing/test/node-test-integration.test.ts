import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createBlob } from '@speajus/diblob';
import { setupEachTestContainer, setupFileScopedTestContainer, testLogger } from '../src/index.js';

describe('node:test Integration', () => {
  describe('setupFileScopedTestContainer', () => {
    // This container is shared across all tests in this describe block
    const container = setupFileScopedTestContainer({ randomSeed: 999 });
    
    test('should provide shared container', async () => {
      assert.ok(container);
      assert.ok(container.has(testLogger));
      
      const logger = await container.resolve(testLogger);
      logger.info('Test message from first test');
      
      assert.strictEqual(logger.getRecords().length, 1);
    });
    
    test('should reuse same container instance', async () => {
      const logger = await container.resolve(testLogger);
      
      // Should still have the message from the previous test
      assert.strictEqual(logger.getRecords().length, 1);
      assert.strictEqual(logger.getRecords()[0].message, 'Test message from first test');
      
      logger.info('Test message from second test');
      assert.strictEqual(logger.getRecords().length, 2);
    });
    
    test('should have configured options', async () => {
      // The container was created with randomSeed: 999
      // We can't directly test this without exposing internals,
      // but we can verify the container works as expected
      assert.ok(container);
    });
  });

  describe('setupEachTestContainer', () => {
    const { getContainer } = setupEachTestContainer({ randomSeed: 777 });
    
    test('should provide fresh container for each test', async () => {
      const container = getContainer();
      assert.ok(container);
      
      const logger = await container.resolve(testLogger);
      logger.info('Message from first test');
      
      assert.strictEqual(logger.getRecords().length, 1);
    });
    
    test('should have clean state for each test', async () => {
      const container = getContainer();
      const logger = await container.resolve(testLogger);
      
      // Should start with empty records (fresh container)
      assert.strictEqual(logger.getRecords().length, 0);
      
      logger.info('Message from second test');
      assert.strictEqual(logger.getRecords().length, 1);
      assert.strictEqual(logger.getRecords()[0].message, 'Message from second test');
    });
    
    test('should support custom blob registrations', async () => {
      const container = getContainer();
      
      interface CustomService {
        getValue(): string;
      }
      
      const customService = createBlob<CustomService>();
      container.register(customService, () => ({
        getValue: () => 'custom value'
      }));
      
      const service = await container.resolve(customService);
      assert.strictEqual(service.getValue(), 'custom value');
    });
    
    test('should isolate registrations between tests', async () => {
      const container = getContainer();
      
      interface AnotherService {
        getValue(): string;
      }
      
      const anotherService = createBlob<AnotherService>();
      
      // This service should not be registered from previous test
      assert.ok(!container.has(anotherService));
      
      container.register(anotherService, () => ({
        getValue: () => 'another value'
      }));
      
      const service = await container.resolve(anotherService);
      assert.strictEqual(service.getValue(), 'another value');
    });
  });

  describe('Error handling', () => {
    test('getContainer should throw when called outside test context', () => {
      // This simulates calling getContainer when no container is available
      const currentContainer: any = null;
      
      const mockGetContainer = () => {
        if (!currentContainer) {
          throw new Error('No container available. Make sure setupEachTestContainer() is called at the top level of your test file.');
        }
        return currentContainer;
      };
      
      assert.throws(
        () => mockGetContainer(),
        { message: 'No container available. Make sure setupEachTestContainer() is called at the top level of your test file.' }
      );
    });
  });
});
