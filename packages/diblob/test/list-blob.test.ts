/**
 * ListBlob tests - array management with automatic invalidation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createListBlob, createContainer, createBlob } from '../src';

describe('ListBlob - Basic Operations', () => {
  it('should create an empty list blob', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);

    assert.strictEqual(list.length, 0);
    assert.deepStrictEqual([...list], []);
  });

  it('should initialize with non-empty array', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => ['initial', 'values']);

    assert.strictEqual(list.length, 2);
    assert.strictEqual(list[0], 'initial');
    assert.strictEqual(list[1], 'values');
    assert.deepStrictEqual([...list], ['initial', 'values']);
  });

  it('should push items to the list', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);

    list.push('a');
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0], 'a');

    list.push('b', 'c');
    assert.strictEqual(list.length, 3);
    assert.deepStrictEqual([...list], ['a', 'b', 'c']);
  });

  it('should push items to pre-initialized list', () => {
    const container = createContainer();
    const list = createListBlob<number>();
    container.register(list, () => [1, 2, 3]);

    assert.strictEqual(list.length, 3);

    list.push(4, 5);
    assert.strictEqual(list.length, 5);
    assert.deepStrictEqual([...list], [1, 2, 3, 4, 5]);
  });

  it('should pop items from the list', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);

    list.push('a', 'b', 'c');

    const item = list.pop();
    assert.strictEqual(item, 'c');
    assert.strictEqual(list.length, 2);
    assert.deepStrictEqual([...list], ['a', 'b']);
  });

  it('should pop items from pre-initialized list', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => ['x', 'y', 'z']);

    const item = list.pop();
    assert.strictEqual(item, 'z');
    assert.strictEqual(list.length, 2);
    assert.deepStrictEqual([...list], ['x', 'y']);
  });

  it('should return undefined when popping from empty list', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);

    const item = list.pop();
    assert.strictEqual(item, undefined);
    assert.strictEqual(list.length, 0);
  });

  it('should shift items from the list', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);

    list.push('a', 'b', 'c');

    const item = list.shift();
    assert.strictEqual(item, 'a');
    assert.strictEqual(list.length, 2);
    assert.deepStrictEqual([...list], ['b', 'c']);
  });

  it('should shift items from pre-initialized list', () => {
    const container = createContainer();
    const list = createListBlob<number>();
    container.register(list, () => [10, 20, 30]);

    const item = list.shift();
    assert.strictEqual(item, 10);
    assert.strictEqual(list.length, 2);
    assert.deepStrictEqual([...list], [20, 30]);
  });

  it('should return undefined when shifting from empty list', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);

    const item = list.shift();
    assert.strictEqual(item, undefined);
    assert.strictEqual(list.length, 0);
  });

  it('should unshift items to the list', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);

    list.push('c');
    list.unshift('a', 'b');

    assert.strictEqual(list.length, 3);
    assert.deepStrictEqual([...list], ['a', 'b', 'c']);
  });

  it('should unshift items to pre-initialized list', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => ['c', 'd']);

    list.unshift('a', 'b');

    assert.strictEqual(list.length, 4);
    assert.deepStrictEqual([...list], ['a', 'b', 'c', 'd']);
  });

  it('should splice items from the list', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);

    list.push('a', 'b', 'c', 'd', 'e');

    // Remove 2 items starting at index 1
    const removed = list.splice(1, 2);
    assert.deepStrictEqual(removed, ['b', 'c']);
    assert.deepStrictEqual([...list], ['a', 'd', 'e']);
  });

  it('should splice items from pre-initialized list', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => ['a', 'b', 'c', 'd', 'e']);

    // Remove 2 items starting at index 1
    const removed = list.splice(1, 2);
    assert.deepStrictEqual(removed, ['b', 'c']);
    assert.deepStrictEqual([...list], ['a', 'd', 'e']);
  });

  it('should splice and insert items', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);

    list.push('a', 'b', 'c');

    // Remove 1 item at index 1 and insert 'x', 'y'
    const removed = list.splice(1, 1, 'x', 'y');
    assert.deepStrictEqual(removed, ['b']);
    assert.deepStrictEqual([...list], ['a', 'x', 'y', 'c']);
  });

  it('should splice without deleteCount (remove to end)', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);

    list.push('a', 'b', 'c', 'd');

    const removed = list.splice(2);
    assert.deepStrictEqual(removed, ['c', 'd']);
    assert.deepStrictEqual([...list], ['a', 'b']);
  });
});

describe('ListBlob - Immutability', () => {
  it('should create new array instances on mutation', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);

    // Create a dependent blob that captures the array reference
    interface ArrayHolder {
      getArray(): string[];
    }

    const holder = createBlob<ArrayHolder>();

    class ArrayHolderImpl implements ArrayHolder {
      constructor(private arr: string[]) {}
      getArray() { return this.arr; }
    }

    list.push('a');
    container.register(holder, ArrayHolderImpl, list);
    const arr1 = holder.getArray();

    // Mutate the list - this should invalidate and create a new array
    list.push('b');
    const arr2 = holder.getArray();

    // Different array instances
    assert.notStrictEqual(arr1, arr2);

    // arr1 should have old value, arr2 should have new value
    assert.strictEqual(arr1.length, 1);
    assert.strictEqual(arr2.length, 2);
  });

  it('should not mutate the array in place', () => {
    const container = createContainer();
    const list = createListBlob<number>();
    container.register(list, () => []);

    list.push(1, 2, 3);

    // Get a reference to the current array
    const snapshot = [...list];

    // Mutate the list
    list.push(4);

    // Snapshot should be unchanged
    assert.deepStrictEqual(snapshot, [1, 2, 3]);
    assert.deepStrictEqual([...list], [1, 2, 3, 4]);
  });
});

describe('ListBlob - Invalidation', () => {
  it('should invalidate dependent blobs when list changes', () => {
    interface Counter {
      count(): number;
    }

    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);
    const counter = createBlob<Counter>();

    class CounterImpl implements Counter {
      constructor(private items: string[]) {}
      count() { return this.items.length; }
    }

    container.register(counter, CounterImpl, list);

    list.push('a');
    assert.strictEqual(counter.count(), 1);

    list.push('b', 'c');
    assert.strictEqual(counter.count(), 3);

    list.pop();
    assert.strictEqual(counter.count(), 2);
  });

  it('should work with dependent blobs on pre-initialized list', () => {
    interface Counter {
      count(): number;
    }

    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => ['initial', 'values']);
    const counter = createBlob<Counter>();

    class CounterImpl implements Counter {
      constructor(private items: string[]) {}
      count() { return this.items.length; }
    }

    container.register(counter, CounterImpl, list);

    // Should see initial values
    assert.strictEqual(counter.count(), 2);

    list.push('new');
    assert.strictEqual(counter.count(), 3);

    list.shift();
    assert.strictEqual(counter.count(), 2);
  });

  it('should propagate changes through dependency chain', () => {
    interface Formatter {
      format(): string;
    }

    interface Display {
      show(): string;
    }

    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);
    const formatter = createBlob<Formatter>();
    const display = createBlob<Display>();

    class FormatterImpl implements Formatter {
      constructor(private items: string[]) {}
      format() { return this.items.join(', '); }
    }

    class DisplayImpl implements Display {
      constructor(private fmt: Formatter) {}
      show() { return `[${this.fmt.format()}]`; }
    }

    container.register(formatter, FormatterImpl, list);
    container.register(display, DisplayImpl, formatter);

    list.push('a');
    assert.strictEqual(display.show(), '[a]');

    list.push('b', 'c');
    assert.strictEqual(display.show(), '[a, b, c]');

    // Clear by splicing all elements
    list.splice(0);
    assert.strictEqual(display.show(), '[]');
  });

  it('should invalidate when using splice to replace all', () => {
    interface Summer {
      sum(): number;
    }

    const container = createContainer();
    const list = createListBlob<number>();
    container.register(list, () => []);
    const summer = createBlob<Summer>();

    class SummerImpl implements Summer {
      constructor(private nums: number[]) {}
      sum() { return this.nums.reduce((a, b) => a + b, 0); }
    }

    container.register(summer, SummerImpl, list);

    list.push(1, 2, 3);
    assert.strictEqual(summer.sum(), 6);

    // Replace all elements using splice
    list.splice(0, list.length, 10, 20);
    assert.strictEqual(summer.sum(), 30);
  });
});

describe('ListBlob - Array-like Behavior', () => {
  it('should support array indexing', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);

    list.push('a', 'b', 'c');

    assert.strictEqual(list[0], 'a');
    assert.strictEqual(list[1], 'b');
    assert.strictEqual(list[2], 'c');
  });

  it('should support array length property', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);

    assert.strictEqual(list.length, 0);

    list.push('a');
    assert.strictEqual(list.length, 1);

    list.push('b', 'c');
    assert.strictEqual(list.length, 3);
  });

  it('should support array iteration', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);

    list.push('a', 'b', 'c');

    const items: string[] = [];
    for (const item of list) {
      items.push(item);
    }

    assert.deepStrictEqual(items, ['a', 'b', 'c']);
  });

  it('should support array methods like map', () => {
    const container = createContainer();
    const list = createListBlob<number>();
    container.register(list, () => []);

    list.push(1, 2, 3);

    const doubled = list.map(x => x * 2);
    assert.deepStrictEqual(doubled, [2, 4, 6]);
  });

  it('should support array methods like filter', () => {
    const container = createContainer();
    const list = createListBlob<number>();
    container.register(list, () => []);

    list.push(1, 2, 3, 4, 5);

    const evens = list.filter(x => x % 2 === 0);
    assert.deepStrictEqual(evens, [2, 4]);
  });

  it('should support array methods like reduce', () => {
    const container = createContainer();
    const list = createListBlob<number>();
    container.register(list, () => []);

    list.push(1, 2, 3, 4);

    const sum = list.reduce((a, b) => a + b, 0);
    assert.strictEqual(sum, 10);
  });
});

describe('ListBlob - Edge Cases', () => {
  it('should handle empty list operations', () => {
    const container = createContainer();
    const list = createListBlob<string>();
    container.register(list, () => []);

    assert.strictEqual(list.pop(), undefined);
    assert.strictEqual(list.shift(), undefined);

    // Clear using splice
    list.splice(0);
    assert.strictEqual(list.length, 0);
  });

  it('should handle complex object types', () => {
    interface User {
      id: number;
      name: string;
    }

    const container = createContainer();
    const list = createListBlob<User>();
    container.register(list, () => []);

    const user1 = { id: 1, name: 'Alice' };
    const user2 = { id: 2, name: 'Bob' };

    list.push(user1, user2);

    assert.strictEqual(list.length, 2);
    assert.strictEqual(list[0].name, 'Alice');
    assert.strictEqual(list[1].name, 'Bob');

    // Remove user1 by finding index and splicing
    const idx = list.indexOf(user1);
    list.splice(idx, 1);
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].name, 'Bob');
  });

  it('should handle large arrays', () => {
    const container = createContainer();
    const list = createListBlob<number>();
    container.register(list, () => []);

    // Add 1000 items
    const items = Array.from({ length: 1000 }, (_, i) => i);
    // Replace all using splice
    list.splice(0, list.length, ...items);

    assert.strictEqual(list.length, 1000);
    assert.strictEqual(list[0], 0);
    assert.strictEqual(list[999], 999);

    // Remove half
    for (let i = 0; i < 500; i++) {
      list.pop();
    }

    assert.strictEqual(list.length, 500);
  });

  it('should handle rapid mutations', () => {
    const container = createContainer();
    const list = createListBlob<number>();
    container.register(list, () => []);

    for (let i = 0; i < 100; i++) {
      list.push(i);
    }

    assert.strictEqual(list.length, 100);

    for (let i = 0; i < 50; i++) {
      list.pop();
    }

    assert.strictEqual(list.length, 50);
  });

  it('should work with different primitive types', () => {
    const container = createContainer();

    const stringList = createListBlob<string>();
    container.register(stringList, () => []);
    stringList.push('hello', 'world');
    assert.strictEqual(stringList.length, 2);

    const numberList = createListBlob<number>();
    container.register(numberList, () => []);
    numberList.push(1, 2, 3);
    assert.strictEqual(numberList.length, 3);

    const boolList = createListBlob<boolean>();
    container.register(boolList, () => []);
    boolList.push(true, false, true);
    assert.strictEqual(boolList.length, 3);
  });
});

