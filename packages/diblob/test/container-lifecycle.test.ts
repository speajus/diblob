/**
 * Container lifecycle tests (singleton vs transient)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createBlob, createContainer, Lifecycle } from '../src';

describe('Container - Lifecycle', () => {
  it('should use singleton lifecycle by default', async () => {
    interface Service {
      id: number;
    }
    
    let counter = 0;
    class ServiceImpl implements Service {
      id: number;
      constructor() {
        this.id = ++counter;
      }
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, ServiceImpl);
    
    const instance1 = await container.resolve(service);
    const instance2 = await container.resolve(service);
    
    assert.strictEqual(instance1.id, instance2.id);
    assert.strictEqual(counter, 1);
  });

  it('should create new instance with transient lifecycle', async () => {
    interface Service {
      id: number;
    }
    
    let counter = 0;
    class ServiceImpl implements Service {
      id: number;
      constructor() {
        this.id = ++counter;
      }
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, ServiceImpl, { lifecycle: Lifecycle.Transient });
    
    const instance1 =await  container.resolve(service);
    const instance2 = await  container.resolve(service);
    
    assert.notStrictEqual(instance1.id, instance2.id);
    assert.strictEqual(counter, 2);
  });

  it('should create new instance on each blob access with transient', () => {
    interface Service {
      id: number;
    }
    
    let counter = 0;
    class ServiceImpl implements Service {
      id: number;
      constructor() {
        this.id = ++counter;
      }
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, ServiceImpl, { lifecycle: Lifecycle.Transient });
    
    const id1 = service.id;
    const id2 = service.id;
    const id3 = service.id;
    
    assert.notStrictEqual(id1, id2);
    assert.notStrictEqual(id2, id3);
    assert.strictEqual(counter, 3);
  });

  it('should support explicit singleton lifecycle', async () => {
    interface Service {
      id: number;
    }
    
    let counter = 0;
    class ServiceImpl implements Service {
      id: number;
      constructor() {
        this.id = ++counter;
      }
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, ServiceImpl, { lifecycle: Lifecycle.Singleton });
    
    const instance1 = await container.resolve(service);
    const instance2 = await container.resolve(service);
    
    assert.strictEqual(instance1.id, instance2.id);
    assert.strictEqual(counter, 1);
  });

  it('should handle lifecycle with dependencies', async () => {
    interface Logger {
      id: number;
    }
    
    interface Service {
      getLoggerId(): number;
    }
    
    let loggerCounter = 0;
    let serviceCounter = 0;
    
    class LoggerImpl implements Logger {
      id: number;
      constructor() {
        this.id = ++loggerCounter;
      }
    }
    
    class ServiceImpl implements Service {
      id: number;
      constructor(private logger: Logger) {
        this.id = ++serviceCounter;
      }
      getLoggerId() { return this.logger.id; }
    }
    
    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(logger, LoggerImpl, { lifecycle: Lifecycle.Transient });
    container.register(service, ServiceImpl, logger, { lifecycle: Lifecycle.Transient });
    
    const s1 = await container.resolve(service);
    const s2 = await container.resolve(service);
    
    // Both service and logger should be new instances
    assert.notStrictEqual(s1,s2);
    assert.notStrictEqual(s1.getLoggerId(), s2.getLoggerId());
  });
});

