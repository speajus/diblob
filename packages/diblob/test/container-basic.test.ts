/**
 * Basic container registration and resolution tests
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createBlob, createContainer,  } from '../src';

describe('Container - Basic Registration', () => {
  it('should register and resolve a simple class', async () => {
    interface Service {
      getValue(): string;
    }
    
    class ServiceImpl implements Service {
      getValue() { return 'test'; }
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, ServiceImpl);
    const instance = await container.resolve(service);
    
    assert.strictEqual(instance.getValue(), 'test');
  });

  it('should register with factory function', async () => {
    interface Service {
      getValue(): string;
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, () => ({
      getValue: () => 'factory'
    }));
    
    const instance =await container.resolve(service);
    assert.strictEqual(instance.getValue(), 'factory');
  });

  it('should use blob directly without explicit resolve', () => {
    interface Service {
      getValue(): string;
    }
    
    class ServiceImpl implements Service {
      getValue() { return 'direct'; }
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, ServiceImpl);
    
    // Use blob directly
    assert.strictEqual(service.getValue(), 'direct');
  });

  it('should throw error for unregistered blob', () => {
    const service = createBlob<{ test: string }>();
    const container = createContainer();
    
    assert.throws(
      () => container.resolve(service),
      /not registered\. Call container\.register\(\) first\./
    );
  });

  it('should check if blob is registered', () => {
    const service = createBlob<{ test: string }>();
    const container = createContainer();
    
    assert.strictEqual(container.has(service), false);
    
    container.register(service, () => ({ test: 'value' }));
    
    assert.strictEqual(container.has(service), true);
  });
});

describe('Container - Dependencies', () => {
  it('should resolve blob dependencies', () => {
    interface Logger {
      log(msg: string): void;
    }
    
    interface Service {
      doWork(): void;
    }
    
    const logs: string[] = [];
    
    class LoggerImpl implements Logger {
      log(msg: string) { logs.push(msg); }
    }
    
    class ServiceImpl implements Service {
      constructor(private logger: Logger) {}
      doWork() { this.logger.log('working'); }
    }
    
    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(logger, LoggerImpl);
    container.register(service, ServiceImpl, logger);
    
    service.doWork();
    assert.deepStrictEqual(logs, ['working']);
  });

  it('should resolve plain value dependencies', () => {
    interface Config {
      getValue(): string;
    }
    
    class ConfigImpl implements Config {
      constructor(private value: string) {}
      getValue() { return this.value; }
    }
    
    const config = createBlob<Config>();
    const container = createContainer();
    
    container.register(config, ConfigImpl, 'test-value');
    
    assert.strictEqual(config.getValue(), 'test-value');
  });

  it('should resolve mixed blob and plain dependencies', () => {
    interface Logger {
      log(msg: string): void;
    }
    
    interface Service {
      getEnv(): string;
    }
    
    class ServiceImpl implements Service {
      constructor(
        private logger: Logger,
        private env: string
      ) {
        this.logger.log('created');
      }
      getEnv() { return this.env; }
    }
    
    const logs: string[] = [];
    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(logger, () => ({
      log: (msg: string) => logs.push(msg)
    }));
    container.register(service, ServiceImpl, logger, 'production');
    
    assert.strictEqual(service.getEnv(), 'production');
    assert.deepStrictEqual(logs, ['created']);
  });
});

