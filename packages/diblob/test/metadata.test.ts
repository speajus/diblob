/**
 * Metadata functionality tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createBlob, createContainer, getBlobMetadata, getContainerMetadata } from '../src';

describe('Blob Metadata', () => {
  it('should create blob without metadata', () => {
    const blob = createBlob<{ test: string }>();
    const metadata = getBlobMetadata(blob);
    assert.strictEqual(metadata, undefined);
  });

  it('should create blob with metadata', () => {
    const blob = createBlob<{ test: string }>('myBlob', {
      name: 'My Test Blob',
      description: 'A blob for testing'
    });
    
    const metadata = getBlobMetadata(blob);
    assert.ok(metadata);
    assert.strictEqual(metadata.name, 'My Test Blob');
    assert.strictEqual(metadata.description, 'A blob for testing');
  });

  it('should support custom metadata properties', () => {
    const blob = createBlob<{ test: string }>('myBlob', {
      name: 'Custom Blob',
      tags: ['test', 'example'],
      version: '1.0.0'
    });
    
    const metadata = getBlobMetadata(blob);
    assert.ok(metadata);
    assert.strictEqual(metadata.name, 'Custom Blob');
    assert.deepStrictEqual(metadata.tags, ['test', 'example']);
    assert.strictEqual(metadata.version, '1.0.0');
  });

  it('should maintain metadata after registration', () => {
    interface Service {
      getValue(): string;
    }
    
    const service = createBlob<Service>('service', {
      name: 'User Service',
      description: 'Handles user operations'
    });
    
    const container = createContainer();
    container.register(service, () => ({ getValue: () => 'test' }));
    
    const metadata = getBlobMetadata(service);
    assert.ok(metadata);
    assert.strictEqual(metadata.name, 'User Service');
    assert.strictEqual(metadata.description, 'Handles user operations');
  });
});

describe('Container Metadata', () => {
  it('should create container without metadata', () => {
    const container = createContainer();
    const metadata = getContainerMetadata(container);
    assert.strictEqual(metadata, undefined);
  });

  it('should create container with metadata', () => {
    const container = createContainer({
      name: 'Main Container',
      description: 'Application-wide DI container'
    });
    
    const metadata = getContainerMetadata(container);
    assert.ok(metadata);
    assert.strictEqual(metadata.name, 'Main Container');
    assert.strictEqual(metadata.description, 'Application-wide DI container');
  });

  it('should create container with metadata and parents', () => {
    const parent = createContainer({
      name: 'Parent Container'
    });
    
    const child = createContainer({
      name: 'Child Container',
      description: 'Inherits from parent'
    }, parent);
    
    const childMetadata = getContainerMetadata(child);
    assert.ok(childMetadata);
    assert.strictEqual(childMetadata.name, 'Child Container');
    assert.strictEqual(childMetadata.description, 'Inherits from parent');
    
    const parentMetadata = getContainerMetadata(parent);
    assert.ok(parentMetadata);
    assert.strictEqual(parentMetadata.name, 'Parent Container');
  });

  it('should support custom metadata properties', () => {
    const container = createContainer({
      name: 'Custom Container',
      environment: 'production',
      version: '2.0.0'
    });
    
    const metadata = getContainerMetadata(container);
    assert.ok(metadata);
    assert.strictEqual(metadata.name, 'Custom Container');
    assert.strictEqual(metadata.environment, 'production');
    assert.strictEqual(metadata.version, '2.0.0');
  });
});

describe('Metadata - Backward Compatibility', () => {
  it('should work with existing code without metadata', () => {
    interface Service {
      getValue(): string;
    }
    
    // Old-style usage without metadata
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, () => ({ getValue: () => 'test' }));
    
    assert.strictEqual(service.getValue(), 'test');
    assert.strictEqual(getBlobMetadata(service), undefined);
    assert.strictEqual(getContainerMetadata(container), undefined);
  });
});

