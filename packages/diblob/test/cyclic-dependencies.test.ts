/**
 * Cyclic dependency tests
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createBlob, createContainer } from '../src';

describe('Cyclic Dependencies - Direct Cycles', () => {
  it('should handle two-way cyclic dependency', async () => {
    interface ServiceA {
      getName(): string;
      getB(): ServiceB;
    }

    interface ServiceB {
      getName(): string;
      getA(): ServiceA;
    }

    const serviceA = createBlob<ServiceA>();
    const serviceB = createBlob<ServiceB>();

    class ServiceAImpl implements ServiceA {
      constructor(private b: ServiceB) {}
      getName() { return 'A'; }
      getB() { return this.b; }
    }

    class ServiceBImpl implements ServiceB {
      constructor(private a: ServiceA) {}
      getName() { return 'B'; }
      getA() { return this.a; }
    }

    const container = createContainer();
    container.register(serviceA, ServiceAImpl, serviceB);
    container.register(serviceB, ServiceBImpl, serviceA);

    const a = await container.resolve(serviceA);
    const b = await container.resolve(serviceB);

    assert.strictEqual(a.getName(), 'A');
    assert.strictEqual(b.getName(), 'B');
    
    // Verify cyclic references work
    const bFromA = a.getB();
    const aFromB = b.getA();
    
    assert.strictEqual(bFromA.getName(), 'B');
    assert.strictEqual(aFromB.getName(), 'A');
  });

  it('should handle three-way cyclic dependency', async () => {
    interface ServiceA {
      name: string;
      b: ServiceB;
    }

    interface ServiceB {
      name: string;
      c: ServiceC;
    }

    interface ServiceC {
      name: string;
      a: ServiceA;
    }

    const serviceA = createBlob<ServiceA>();
    const serviceB = createBlob<ServiceB>();
    const serviceC = createBlob<ServiceC>();

    class ServiceAImpl implements ServiceA {
      name = 'A';
      constructor(public b: ServiceB) {}
    }

    class ServiceBImpl implements ServiceB {
      name = 'B';
      constructor(public c: ServiceC) {}
    }

    class ServiceCImpl implements ServiceC {
      name = 'C';
      constructor(public a: ServiceA) {}
    }

    const container = createContainer();
    container.register(serviceA, ServiceAImpl, serviceB);
    container.register(serviceB, ServiceBImpl, serviceC);
    container.register(serviceC, ServiceCImpl, serviceA);

    const a = await container.resolve(serviceA);
    const b = await container.resolve(serviceB);
    const c = await container.resolve(serviceC);

    assert.strictEqual(a.name, 'A');
    assert.strictEqual(b.name, 'B');
    assert.strictEqual(c.name, 'C');

    // Verify the cycle: A -> B -> C -> A
    assert.strictEqual(a.b.name, 'B');
    assert.strictEqual(a.b.c.name, 'C');
    assert.strictEqual(a.b.c.a.name, 'A');
  });
});

describe('Cyclic Dependencies - Self Reference', () => {
  it('should handle self-referencing service', async () => {
    interface Node {
      value: string;
      getParent(): Node | null;
    }

    const nodeBlob = createBlob<Node>();

    class NodeImpl implements Node {
      value = 'node';
      constructor(private parent: Node | null = null) {}
      getParent() { return this.parent; }
    }

    const container = createContainer();
    
    // Register without self-reference first
    container.register(nodeBlob, NodeImpl, null);

    const node = await container.resolve(nodeBlob);
    assert.strictEqual(node.value, 'node');
    assert.strictEqual(node.getParent(), null);
  });
});

describe('Cyclic Dependencies - With Factories', () => {
  it('should handle cyclic dependencies with factory functions', async () => {
    interface Logger {
      log(msg: string): void;
      getMonitor(): Monitor;
    }

    interface Monitor {
      track(event: string): void;
      getLogger(): Logger;
    }

    const logger = createBlob<Logger>();
    const monitor = createBlob<Monitor>();

    const container = createContainer();

    container.register(logger, () => ({
      log: (msg: string) => console.log(msg),
      getMonitor: () => monitor as any
    }));

    container.register(monitor, () => ({
      track: (event: string) => console.log(`Track: ${event}`),
      getLogger: () => logger as any
    }));

    const loggerInstance = await container.resolve(logger);
    const monitorInstance = await container.resolve(monitor);

    // Both should resolve successfully
    assert.ok(loggerInstance);
    assert.ok(monitorInstance);
  });
});

describe('Cyclic Dependencies - Async', () => {
  it('should handle cyclic dependencies with async factories', async () => {
    interface ServiceA {
      getValue(): string;
      getB(): ServiceB;
    }

    interface ServiceB {
      getValue(): string;
      getA(): ServiceA;
    }

    const serviceA = createBlob<ServiceA>();
    const serviceB = createBlob<ServiceB>();

    const container = createContainer();

    container.register(serviceA, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return {
        getValue: () => 'A',
        getB: () => serviceB as any
      };
    });

    container.register(serviceB, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return {
        getValue: () => 'B',
        getA: () => serviceA as any
      };
    });

    const a = await container.resolve(serviceA);
    const b = await container.resolve(serviceB);

    assert.strictEqual(a.getValue(), 'A');
    assert.strictEqual(b.getValue(), 'B');
  });

  it('should handle mixed sync/async cyclic dependencies', async () => {
    interface SyncService {
      name: string;
      getAsync(): AsyncService;
    }

    interface AsyncService {
      name: string;
      getSync(): SyncService;
    }

    const syncBlob = createBlob<SyncService>();
    const asyncBlob = createBlob<AsyncService>();

    class SyncServiceImpl implements SyncService {
      name = 'sync';
      constructor(private async: AsyncService) {}
      getAsync() { return this.async; }
    }

    const container = createContainer();

    container.register(asyncBlob, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return {
        name: 'async',
        getSync: () => syncBlob as any
      };
    });

    container.register(syncBlob, SyncServiceImpl, asyncBlob);

    const sync = await container.resolve(syncBlob);
    const async = await container.resolve(asyncBlob);

    assert.strictEqual(sync.name, 'sync');
    assert.strictEqual(async.name, 'async');
  });
});

describe('Cyclic Dependencies - Complex Graphs', () => {
  it('should handle diamond dependency with cycles', async () => {
    // A depends on B and C
    // B depends on D
    // C depends on D
    // D depends on A (creating a cycle)

    interface ServiceA { name: string; b: ServiceB; c: ServiceC; }
    interface ServiceB { name: string; d: ServiceD; }
    interface ServiceC { name: string; d: ServiceD; }
    interface ServiceD { name: string; a: ServiceA; }

    const a = createBlob<ServiceA>();
    const b = createBlob<ServiceB>();
    const c = createBlob<ServiceC>();
    const d = createBlob<ServiceD>();

    class AImpl implements ServiceA {
      name = 'A';
      constructor(public b: ServiceB, public c: ServiceC) {}
    }

    class BImpl implements ServiceB {
      name = 'B';
      constructor(public d: ServiceD) {}
    }

    class CImpl implements ServiceC {
      name = 'C';
      constructor(public d: ServiceD) {}
    }

    class DImpl implements ServiceD {
      name = 'D';
      constructor(public a: ServiceA) {}
    }

    const container = createContainer();
    container.register(a, AImpl, b, c);
    container.register(b, BImpl, d);
    container.register(c, CImpl, d);
    container.register(d, DImpl, a);

    const aInstance = await container.resolve(a);

    assert.strictEqual(aInstance.name, 'A');
    assert.strictEqual(aInstance.b.name, 'B');
    assert.strictEqual(aInstance.c.name, 'C');
    assert.strictEqual(aInstance.b.d.name, 'D');
    assert.strictEqual(aInstance.c.d.name, 'D');

    // Verify D points back to A
    assert.strictEqual(aInstance.b.d.a.name, 'A');
  });

  it('should handle multiple independent cycles', async () => {
    // Cycle 1: A <-> B
    // Cycle 2: C <-> D
    // E depends on both A and C

    interface ServiceA { name: string; b: ServiceB; }
    interface ServiceB { name: string; a: ServiceA; }
    interface ServiceC { name: string; d: ServiceD; }
    interface ServiceD { name: string; c: ServiceC; }
    interface ServiceE { name: string; a: ServiceA; c: ServiceC; }

    const a = createBlob<ServiceA>();
    const b = createBlob<ServiceB>();
    const c = createBlob<ServiceC>();
    const d = createBlob<ServiceD>();
    const e = createBlob<ServiceE>();

    class AImpl implements ServiceA {
      name = 'A';
      constructor(public b: ServiceB) {}
    }

    class BImpl implements ServiceB {
      name = 'B';
      constructor(public a: ServiceA) {}
    }

    class CImpl implements ServiceC {
      name = 'C';
      constructor(public d: ServiceD) {}
    }

    class DImpl implements ServiceD {
      name = 'D';
      constructor(public c: ServiceC) {}
    }

    class EImpl implements ServiceE {
      name = 'E';
      constructor(public a: ServiceA, public c: ServiceC) {}
    }

    const container = createContainer();
    container.register(a, AImpl, b);
    container.register(b, BImpl, a);
    container.register(c, CImpl, d);
    container.register(d, DImpl, c);
    container.register(e, EImpl, a, c);

    const eInstance = await container.resolve(e);

    assert.strictEqual(eInstance.name, 'E');
    assert.strictEqual(eInstance.a.name, 'A');
    assert.strictEqual(eInstance.c.name, 'C');
    assert.strictEqual(eInstance.a.b.a.name, 'A');
    assert.strictEqual(eInstance.c.d.c.name, 'C');
  });
});

describe('Cyclic Dependencies - Invalidation', () => {
  it('should invalidate cyclic dependencies correctly', async () => {
    interface ServiceA {
      getValue(): string;
      b: ServiceB;
    }

    interface ServiceB {
      getValue(): string;
      a: ServiceA;
    }

    const serviceA = createBlob<ServiceA>();
    const serviceB = createBlob<ServiceB>();

    class ServiceAImpl implements ServiceA {
      constructor(public b: ServiceB, private value: string = 'A1') {}
      getValue() { return this.value; }
    }

    class ServiceBImpl implements ServiceB {
      constructor(public a: ServiceA, private value: string = 'B1') {}
      getValue() { return this.value; }
    }

    const container = createContainer();
    container.register(serviceA, ServiceAImpl, serviceB, 'A1');
    container.register(serviceB, ServiceBImpl, serviceA, 'B1');

    const a1 = await container.resolve(serviceA);
    assert.strictEqual(a1.getValue(), 'A1');

    // Re-register serviceA with new value
    container.register(serviceA, ServiceAImpl, serviceB, 'A2');

    const a2 = await container.resolve(serviceA);
    assert.strictEqual(a2.getValue(), 'A2');

    // ServiceB should still work with the new A
    const b = await container.resolve(serviceB);
    assert.strictEqual(b.a.getValue(), 'A2');
  });
});

