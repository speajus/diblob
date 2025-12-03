import assert from 'node:assert';
import { describe, it } from 'node:test';

import { createBlob } from '../src/blob';
import { createContainer, introspectContainer } from '../src/container';
import { blobPropSymbol, Lifecycle } from '../src/types';

describe('Container Introspection - Basic', () => {
  it('should include registrations, metadata, lifecycle, and dependencies', () => {
    interface Dep {
      value: number;
    }

    interface Service {
      value: string;
    }

    const dep = createBlob<Dep>('dep', { name: 'Dep' });
    const service = createBlob<Service>('service', { name: 'Service' });

    const container = createContainer({ name: 'Main' });

    container.register(dep, () => ({ value: 42 }));
    container.register(service, (d: Dep) => ({ value: String(d.value) }), dep);

    // Force resolution and dependency tracking
    const result = service.value;
    assert.strictEqual(result, '42');

    const snapshot = introspectContainer(container);

    assert.strictEqual(snapshot.metadata?.name, 'Main');

    const depNode = snapshot.blobs.find((b) => b.blob === dep);
    const serviceNode = snapshot.blobs.find((b) => b.blob === service);

    assert.ok(depNode, 'Expected dep registration in introspection');
    assert.ok(serviceNode, 'Expected service registration in introspection');

    assert.strictEqual(serviceNode!.metadata?.name, 'Service');
    assert.strictEqual(depNode!.metadata?.name, 'Dep');

    assert.strictEqual(serviceNode!.lifecycle, Lifecycle.Singleton);
    assert.strictEqual(depNode!.lifecycle, Lifecycle.Singleton);

    assert.strictEqual(serviceNode!.hasInstance, true);
    assert.strictEqual(depNode!.hasInstance, true);
    assert.strictEqual(serviceNode!.isResolving, false);
    assert.strictEqual(depNode!.isResolving, false);

    const depId = dep[blobPropSymbol];
    const serviceId = service[blobPropSymbol];

    assert.ok(
      serviceNode!.dependencies.includes(depId),
      'Service should depend on dep',
    );
    assert.ok(
      depNode!.dependents.includes(serviceId),
      'Dep should have service as dependent',
    );
  });
});

describe('Container Introspection - Empty', () => {
  it('should handle containers with no registrations', () => {
    const container = createContainer({ name: 'Empty' });

    const snapshot = introspectContainer(container);

    assert.strictEqual(snapshot.metadata?.name, 'Empty');
    assert.deepStrictEqual(snapshot.blobs, []);
  });
});

