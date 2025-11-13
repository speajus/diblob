/**
 * Edge cases and error handling tests
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createBlob, createContainer } from '../src';

describe('Edge Cases - Error Handling', () => {
  it('should throw error when accessing unregistered blob', () => {
    const blob = createBlob<{ test: string }>();
    
    assert.throws(
      () => blob.test,
      /Blob not yet resolved/
    );
  });

  it('should throw error when resolving unregistered blob', () => {
    const blob = createBlob<{ test: string }>();
    const container = createContainer();
    
    assert.throws(
      () => container.resolve(blob),
      /Blob not registered/
    );
  });

  it('should handle null and undefined values', () => {
    interface Service {
      getValue(): string | null;
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, () => ({
      getValue: () => null
    }));
    
    assert.strictEqual(service.getValue(), null);
  });

  it('should handle methods returning promises', async () => {
    interface Service {
      getValue(): Promise<string>;
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, () => ({
      getValue: async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async-result';
      }
    }));
    
    const result = await service.getValue();
    assert.strictEqual(result, 'async-result');
  });

  it('should handle empty constructor', () => {
    class EmptyService {
      getValue() { return 'empty'; }
    }
    
    const service = createBlob<EmptyService>();
    const container = createContainer();
    
    container.register(service, EmptyService);
    
    assert.strictEqual(service.getValue(), 'empty');
  });

  it('should handle factory returning primitive wrapper', () => {
    interface Service {
      toString(): string;
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, () => new String('test') as any);
    
    assert.strictEqual(service.toString(), 'test');
  });
});

describe('Edge Cases - Method Binding', () => {
  it('should bind methods correctly', () => {
    interface Service {
      getValue(): string;
    }
    
    class ServiceImpl implements Service {
      private value = 'bound';
      
      getValue() {
        return this.value;
      }
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, ServiceImpl);
    
    const getValue = service.getValue;
    assert.strictEqual(getValue(), 'bound');
  });

  it('should handle arrow functions', () => {
    interface Service {
      getValue: () => string;
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, () => ({
      getValue: () => 'arrow'
    }));
    
    const getValue = service.getValue;
    assert.strictEqual(getValue(), 'arrow');
  });

  it('should handle getters and setters', () => {
    interface Service {
      value: string;
    }
    
    class ServiceImpl implements Service {
      private _value = 'initial';
      
      get value() { return this._value; }
      set value(v: string) { this._value = v; }
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, ServiceImpl);
    
    assert.strictEqual(service.value, 'initial');
    service.value = 'updated';
    assert.strictEqual(service.value, 'updated');
  });
});

describe('Edge Cases - Special Values', () => {
  it('should handle Symbol properties', () => {
    const sym = Symbol('test');
    
    interface Service {
      [sym]: string;
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, () => ({
      [sym]: 'symbol-value'
    }));
    
    assert.strictEqual(service[sym], 'symbol-value');
  });

  it('should handle numeric properties', () => {
    interface Service {
      [key: number]: string;
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, () => ({
      0: 'zero',
      1: 'one'
    }));
    
    assert.strictEqual(service[0], 'zero');
    assert.strictEqual(service[1], 'one');
  });

  it('should handle arrays', () => {
    interface Service {
      items: string[];
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, () => ({
      items: ['a', 'b', 'c']
    }));
    
    assert.deepStrictEqual(service.items, ['a', 'b', 'c']);
  });
});

