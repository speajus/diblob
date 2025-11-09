/**
 * Async resolution tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createBlob, createContainer } from '../src';

describe('Container - Async Resolution', () => {
  it('should resolve async factory', async () => {
    interface Service {
      getValue(): string;
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { getValue: () => 'async' };
    });
    
    const instance = await container.resolve(service);
    assert.strictEqual(instance.getValue(), 'async');
  });

  it('should use async blob directly', async () => {
    interface Service {
      getValue(): string;
    }

    const service = createBlob<Service>();
    const container = createContainer();

    container.register(service, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { getValue: () => 'async' };
    });

    // When accessing a method on an async blob, it returns a Promise
    // that resolves to the bound method
    const getValue = await service.getValue;
    const result = getValue();
    assert.strictEqual(result, 'async');
  });

  it('should handle async dependencies', async () => {
    interface Logger {
      log(msg: string): string;
    }
    
    interface Service {
      work(): string;
    }
    
    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(logger, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { log: (msg: string) => `async: ${msg}` };
    });
    
    container.register(service, async (log: Logger) => {
      return { work: () => log.log('working') };
    }, logger);
    
    const instance = await container.resolve(service);
    assert.strictEqual(instance.work(), 'async: working');
  });

  it('should handle mixed sync and async dependencies', async () => {
    interface Logger {
      log(msg: string): string;
    }
    
    interface Config {
      getValue(): string;
    }
    
    interface Service {
      work(): string;
    }
    
    const logger = createBlob<Logger>();
    const config = createBlob<Config>();
    const service = createBlob<Service>();
    const container = createContainer();
    
    // Async logger
    container.register(logger, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { log: (msg: string) => `[LOG] ${msg}` };
    });
    
    // Sync config
    container.register(config, () => ({
      getValue: () => 'production'
    }));
    
    // Service with both
    container.register(service, (log: Logger, cfg: Config) => ({
      work: () => log.log(cfg.getValue())
    }), logger, config);
    
    const instance = await container.resolve(service);
    assert.strictEqual(instance.work(), '[LOG] production');
  });

  it('should handle async class constructor', async () => {
    interface Service {
      getValue(): string;
    }
    
    class ServiceImpl implements Service {
      private value: string;
      
      constructor() {
        this.value = 'constructed';
      }
      
      getValue() { return this.value; }
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return new ServiceImpl();
    });
    
    const instance = await container.resolve(service);
    assert.strictEqual(instance.getValue(), 'constructed');
  });

  it('should handle deep async dependency chains', async () => {
    interface A { getValue(): string; }
    interface B { getValue(): string; }
    interface C { getValue(): string; }
    
    const a = createBlob<A>();
    const b = createBlob<B>();
    const c = createBlob<C>();
    const container = createContainer();
    
    container.register(a, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { getValue: () => 'A' };
    });
    
    container.register(b, async (aVal: A) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { getValue: () => `B(${aVal.getValue()})` };
    }, a);
    
    container.register(c, async (bVal: B) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { getValue: () => `C(${bVal.getValue()})` };
    }, b);
    
    const instance = await container.resolve(c);
    assert.strictEqual(instance.getValue(), 'C(B(A))');
  });
});

