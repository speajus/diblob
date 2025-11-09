/**
 * Reactive dependency invalidation tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createBlob, createContainer } from '../src';

describe('Container - Reactive Dependencies', () => {
  it('should invalidate cached instance on re-registration', () => {
    interface Service {
      getValue(): string;
    }
    
    class ServiceImpl1 implements Service {
      getValue() { return 'v1'; }
    }
    
    class ServiceImpl2 implements Service {
      getValue() { return 'v2'; }
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, ServiceImpl1);
    assert.strictEqual(service.getValue(), 'v1');
    
    container.register(service, ServiceImpl2);
    assert.strictEqual(service.getValue(), 'v2');
  });

  it('should invalidate dependent blobs transitively', () => {
    interface Logger {
      log(msg: string): string;
    }
    
    interface Service {
      doWork(): string;
    }
    
    class Logger1 implements Logger {
      log(msg: string) { return `L1: ${msg}`; }
    }
    
    class Logger2 implements Logger {
      log(msg: string) { return `L2: ${msg}`; }
    }
    
    class ServiceImpl implements Service {
      constructor(private logger: Logger) {}
      doWork() { return this.logger.log('work'); }
    }
    
    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(logger, Logger1);
    container.register(service, ServiceImpl, logger);
    
    assert.strictEqual(service.doWork(), 'L1: work');
    
    // Re-register logger - service should get new logger
    container.register(logger, Logger2);
    assert.strictEqual(service.doWork(), 'L2: work');
  });

  it('should handle deep dependency chains', () => {
    interface A { getValue(): string; }
    interface B { getValue(): string; }
    interface C { getValue(): string; }
    
    class AImpl implements A {
      constructor(private name: string) {}
      getValue() { return this.name; }
    }
    
    class BImpl implements B {
      constructor(private a: A) {}
      getValue() { return `B(${this.a.getValue()})`; }
    }
    
    class CImpl implements C {
      constructor(private b: B) {}
      getValue() { return `C(${this.b.getValue()})`; }
    }
    
    const a = createBlob<A>();
    const b = createBlob<B>();
    const c = createBlob<C>();
    const container = createContainer();
    
    container.register(a, AImpl, 'A1');
    container.register(b, BImpl, a);
    container.register(c, CImpl, b);
    
    assert.strictEqual(c.getValue(), 'C(B(A1))');
    
    // Re-register A - should invalidate B and C
    container.register(a, AImpl, 'A2');
    assert.strictEqual(c.getValue(), 'C(B(A2))');
  });

  it('should handle multiple dependents', () => {
    interface Logger {
      log(msg: string): string;
    }
    
    interface ServiceA {
      work(): string;
    }
    
    interface ServiceB {
      work(): string;
    }
    
    class Logger1 implements Logger {
      log(msg: string) { return `L1: ${msg}`; }
    }
    
    class Logger2 implements Logger {
      log(msg: string) { return `L2: ${msg}`; }
    }
    
    class ServiceAImpl implements ServiceA {
      constructor(private logger: Logger) {}
      work() { return this.logger.log('A'); }
    }
    
    class ServiceBImpl implements ServiceB {
      constructor(private logger: Logger) {}
      work() { return this.logger.log('B'); }
    }
    
    const logger = createBlob<Logger>();
    const serviceA = createBlob<ServiceA>();
    const serviceB = createBlob<ServiceB>();
    const container = createContainer();
    
    container.register(logger, Logger1);
    container.register(serviceA, ServiceAImpl, logger);
    container.register(serviceB, ServiceBImpl, logger);
    
    assert.strictEqual(serviceA.work(), 'L1: A');
    assert.strictEqual(serviceB.work(), 'L1: B');
    
    // Re-register logger - both services should update
    container.register(logger, Logger2);
    assert.strictEqual(serviceA.work(), 'L2: A');
    assert.strictEqual(serviceB.work(), 'L2: B');
  });
});

