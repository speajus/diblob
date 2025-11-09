/**
 * Container nesting and merging tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createBlob, createContainer } from '../src';

describe('Container - Nesting', () => {
  it('should create child container', () => {
    const parent = createContainer();
    const child = createContainer(parent);
    
    assert.ok(parent);
    assert.ok(child);
  });

  it('should inherit registrations from parent', async () => {
    interface Service {
      getValue(): string;
    }
    
    const service = createBlob<Service>();
    const parent = createContainer();
    const child = createContainer(parent);
    
    parent.register(service, () => ({ getValue: () => 'parent' }));
    
    const instance = await child.resolve(service);
    assert.strictEqual(instance.getValue(), 'parent');
  });

  it('should override parent registration',async () => {
    interface Service {
      getValue(): string;
    }
    
    const service = createBlob<Service>();
    const parent = createContainer();
    const child = createContainer(parent);
    
    parent.register(service, () => ({ getValue: () => 'parent' }));
    child.register(service, () => ({ getValue: () => 'child' }));
    
    const parentInstance = await parent.resolve(service);
    const childInstance = await child.resolve(service);
    
    assert.strictEqual(parentInstance.getValue(), 'parent');
    assert.strictEqual(childInstance.getValue(), 'child');
  });

  it('should check parent for has()', () => {
    interface Service {
      getValue(): string;
    }
    
    const service = createBlob<Service>();
    const parent = createContainer();
    const child = createContainer(parent);
    
    assert.strictEqual(child.has(service), false);
    
    parent.register(service, () => ({ getValue: () => 'test' }));
    
    assert.strictEqual(child.has(service), true);
  });

  it('should handle multiple levels of nesting', async () => {
    interface Service {
      getValue(): string;
    }
    
    const service = createBlob<Service>();
    const grandparent = createContainer();
    const parent = createContainer(grandparent);
    const child = createContainer(parent);
    
    grandparent.register(service, () => ({ getValue: () => 'grandparent' }));
    
    const instance =await  child.resolve(service);
    assert.strictEqual(instance.getValue(), 'grandparent');
  });

  it('should resolve from nearest ancestor', async () => {
    interface Service {
      getValue(): string;
    }
    
    const service = createBlob<Service>();
    const grandparent = createContainer();
    const parent = createContainer(grandparent);
    const child = createContainer(parent);
    
    grandparent.register(service, () => ({ getValue: () => 'grandparent' }));
    parent.register(service, () => ({ getValue: () => 'parent' }));
    
    const instance = await child.resolve(service);
    assert.strictEqual(instance.getValue(), 'parent');
  });
});

describe('Container - Merging', () => {
  it('should merge multiple containers', () => {
    const c1 = createContainer();
    const c2 = createContainer();
    const merged = createContainer(c1, c2);
    
    assert.ok(merged);
  });

  it('should resolve from all parent containers', async () => {
    interface ServiceA {
      getValue(): string;
    }
    
    interface ServiceB {
      getValue(): string;
    }
    
    const serviceA = createBlob<ServiceA>();
    const serviceB = createBlob<ServiceB>();
    
    const c1 = createContainer();
    const c2 = createContainer();
    const merged = createContainer(c1, c2);
    
    c1.register(serviceA, () => ({ getValue: () => 'A' }));
    c2.register(serviceB, () => ({ getValue: () => 'B' }));
    
    const instanceA = await merged.resolve(serviceA);
    const instanceB = await merged.resolve(serviceB);
    
    assert.strictEqual(instanceA.getValue(), 'A');
    assert.strictEqual(instanceB.getValue(), 'B');
  });

  it('should use last parent for conflicts',async () => {
    interface Service {
      getValue(): string;
    }
    
    const service = createBlob<Service>();
    
    const c1 = createContainer();
    const c2 = createContainer();
    const c3 = createContainer();
    const merged = createContainer(c1, c2, c3);
    
    c1.register(service, () => ({ getValue: () => 'C1' }));
    c2.register(service, () => ({ getValue: () => 'C2' }));
    c3.register(service, () => ({ getValue: () => 'C3' }));
    
    const instance =await  merged.resolve(service);
    assert.strictEqual(instance.getValue(), 'C3');
  });

  it('should handle partial overlaps', async () => {
    interface ServiceA { getValue(): string; }
    interface ServiceB { getValue(): string; }
    
    const serviceA = createBlob<ServiceA>();
    const serviceB = createBlob<ServiceB>();
    
    const c1 = createContainer();
    const c2 = createContainer();
    const merged = createContainer(c1, c2);
    
    c1.register(serviceA, () => ({ getValue: () => 'A1' }));
    c1.register(serviceB, () => ({ getValue: () => 'B1' }));
    c2.register(serviceB, () => ({ getValue: () => 'B2' }));
    
    const instanceA =await  merged.resolve(serviceA);
    const instanceB =await  merged.resolve(serviceB);
    
    assert.strictEqual(instanceA.getValue(), 'A1');
    assert.strictEqual(instanceB.getValue(), 'B2'); // c2 wins
  });
});

