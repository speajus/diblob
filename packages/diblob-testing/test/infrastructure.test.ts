import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createTestContainer, testClock, testLogger, testRandom } from '../src/index.js';

describe('Test Infrastructure Blobs', () => {
  describe('TestLogger', () => {
    test('should record log messages with metadata', async () => {
      const container = createTestContainer();
      const logger = await container.resolve(testLogger);
      
      logger.info('Test message', { key: 'value' });
      logger.warn('Warning message');
      logger.error('Error message', { error: true });
      logger.debug('Debug message');
      
      const records = logger.getRecords();
      assert.strictEqual(records.length, 4);
      
      assert.strictEqual(records[0].level, 'info');
      assert.strictEqual(records[0].message, 'Test message');
      assert.deepStrictEqual(records[0].meta, { key: 'value' });
      assert.ok(typeof records[0].timestamp === 'number');
      
      assert.strictEqual(records[1].level, 'warn');
      assert.strictEqual(records[1].message, 'Warning message');
      assert.strictEqual(records[1].meta, undefined);
      
      await container.dispose();
    });

    test('should clear records', async () => {
      const container = createTestContainer();
      const logger = await container.resolve(testLogger);
      
      logger.info('Test message');
      assert.strictEqual(logger.getRecords().length, 1);
      
      logger.clear();
      assert.strictEqual(logger.getRecords().length, 0);
      
      await container.dispose();
    });
  });

  describe('TestClock', () => {
    test('should start at configured initial time', async () => {
      const container = createTestContainer({ initialTime: 5000 });
      const clock = await container.resolve(testClock);
      
      assert.strictEqual(clock.now(), 5000);
      
      await container.dispose();
    });

    test('should advance time', async () => {
      const container = createTestContainer({ initialTime: 1000 });
      const clock = await container.resolve(testClock);
      
      clock.advanceBy(500);
      assert.strictEqual(clock.now(), 1500);
      
      clock.advanceBy(1000);
      assert.strictEqual(clock.now(), 2500);
      
      await container.dispose();
    });

    test('should move to specific timestamp', async () => {
      const container = createTestContainer();
      const clock = await container.resolve(testClock);
      
      clock.moveTo(10000);
      assert.strictEqual(clock.now(), 10000);
      
      clock.moveTo(5000);
      assert.strictEqual(clock.now(), 5000);
      
      await container.dispose();
    });

    test('should reject negative values', async () => {
      const container = createTestContainer();
      const clock = await container.resolve(testClock);
      
      assert.throws(() => clock.advanceBy(-100), { message: 'Cannot advance time by negative amount' });
      assert.throws(() => clock.moveTo(-100), { message: 'Cannot move to negative timestamp' });
      
      await container.dispose();
    });
  });

  describe('TestRandom', () => {
    test('should generate deterministic values', async () => {
      const container = createTestContainer({ randomSeed: 123 });
      const random = await container.resolve(testRandom);
      
      const values1 = [random.random(), random.random(), random.random()];
      
      random.reset();
      const values2 = [random.random(), random.random(), random.random()];
      
      assert.deepStrictEqual(values1, values2);
      
      await container.dispose();
    });

    test('should generate random integers in range', async () => {
      const container = createTestContainer({ randomSeed: 42 });
      const random = await container.resolve(testRandom);
      
      for (let i = 0; i < 100; i++) {
        const value = random.randomInt(10, 20);
        assert.ok(value >= 10 && value < 20);
        assert.ok(Number.isInteger(value));
      }
      
      await container.dispose();
    });

    test('should validate randomInt parameters', async () => {
      const container = createTestContainer();
      const random = await container.resolve(testRandom);
      
      assert.throws(() => random.randomInt(20, 10), { message: 'min must be less than max' });
      assert.throws(() => random.randomInt(1.5, 10), { message: 'min and max must be integers' });
      assert.throws(() => random.randomInt(1, 10.5), { message: 'min and max must be integers' });
      
      await container.dispose();
    });
  });
});
