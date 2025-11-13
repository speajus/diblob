/**
 * Blob creation and basic functionality tests
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createBlob, getBlobId, isBlob } from '../src/blob';
import { blobPropSymbol } from '../src/types';

describe('Blob Creation', () => {
  it('should create a blob', () => {
    const blob = createBlob<{ test: string }>();
    assert.ok(blob);
  });

  it('should create a blob with custom name', () => {
    const blob = createBlob<{ test: string }>('myBlob');
    const id = getBlobId(blob);
    assert.ok(id);
    assert.strictEqual(id.description, 'myBlob');
  });

  it('should create unique blobs', () => {
    const blob1 = createBlob<{ test: string }>();
    const blob2 = createBlob<{ test: string }>();
    
    const id1 = getBlobId(blob1);
    const id2 = getBlobId(blob2);
    
    assert.notStrictEqual(id1, id2);
  });

  it('should identify blobs with isBlob', () => {
    const blob = createBlob<{ test: string }>();
    assert.strictEqual(isBlob(blob), true);
    assert.strictEqual(isBlob({}), false);
    assert.strictEqual(isBlob(null), false);
    assert.strictEqual(isBlob(undefined), false);
  });

  it('should have blobPropSymbol property', () => {
    const blob = createBlob<{ test: string }>();
    const id = (blob as any)[blobPropSymbol];
    assert.ok(id);
    assert.strictEqual(typeof id, 'symbol');
  });

  it('should throw error when accessing unregistered blob', () => {
    const blob = createBlob<{ test: string }>();
    assert.throws(
      () => blob.test,
      /Blob not yet resolved/
    );
  });

  it('should get blob ID', () => {
    const blob = createBlob<{ test: string }>();
    const id = getBlobId(blob);
    assert.ok(id);
    assert.strictEqual(typeof id, 'symbol');
  });

  it('should throw error for invalid blob in getBlobId', () => {
    assert.throws(
      () => getBlobId({} as any),
      /Invalid blob/
    );
  });
});

describe('Blob Type Safety', () => {
  it('should maintain type information', () => {
    interface MyService {
      getValue(): string;
    }
    
    const blob = createBlob<MyService>();
    
    // TypeScript should allow this (runtime will fail until registered)
    // This test just ensures the type is correct
    const _typeCheck: MyService = blob;
    assert.ok(_typeCheck);
  });
});

