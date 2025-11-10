# createListBlob

Create a list blob that manages an array with automatic invalidation.

## Signature

```typescript
function createListBlob<T>(
  name?: string,
  metadata?: BlobMetadata
): Blob<Array<T>>
```

## Parameters

- **`name`** (optional): A name for the blob, used in Symbol creation for debugging
- **`metadata`** (optional): Metadata for debugging and visualization

## Returns

A `Blob<Array<T>>` that acts as an array and automatically invalidates dependents when mutated.

## Basic Usage

```typescript
import { createListBlob, createContainer } from '@speajus/diblob';

const todoList = createListBlob<string>();
const container = createContainer();

// Register with initial array
container.register(todoList, () => []);

// Use as an array
todoList.push('Buy groceries');
todoList.push('Walk the dog');

console.log(todoList.length); // 2
console.log(todoList[0]);     // 'Buy groceries'
```

## With Initial Data

```typescript
const numbers = createListBlob<number>('numbers');
container.register(numbers, () => [1, 2, 3, 4, 5]);

console.log(numbers.length); // 5
numbers.push(6);
console.log(numbers.length); // 6
```

## With Metadata

```typescript
const users = createListBlob<User>('users', {
  description: 'List of active users',
  tags: ['state', 'users']
});

container.register(users, () => []);
```

## Mutation Methods

All standard array mutation methods trigger automatic invalidation:

```typescript
// Adding
list.push(item);              // Add to end
list.unshift(item);           // Add to beginning

// Removing
list.pop();                   // Remove from end
list.shift();                 // Remove from beginning
list.splice(start, count);    // Remove items

// Modifying
list.reverse();               // Reverse order
list.sort();                  // Sort items
list.fill(value, start, end); // Fill range
list.copyWithin(t, s, e);     // Copy within
```

## Read-Only Methods

These methods don't trigger invalidation:

```typescript
list.map(fn);        // Transform items
list.filter(fn);     // Filter items
list.reduce(fn, v);  // Reduce to value
list.find(fn);       // Find item
list.indexOf(item);  // Find index
list.includes(item); // Check inclusion
list.join(sep);      // Join to string
list.slice(s, e);    // Get slice
list.forEach(fn);    // Iterate
// ... and all other read-only array methods
```

## With Dependencies

```typescript
interface TodoCounter {
  count(): number;
}

const todos = createListBlob<string>();
const counter = createBlob<TodoCounter>();

class TodoCounterImpl implements TodoCounter {
  constructor(private items: string[]) {}
  count() { return this.items.length; }
}

container.register(todos, () => []);
container.register(counter, TodoCounterImpl, todos);

todos.push('Task 1');
console.log(counter.count()); // 1 - automatically updated!
```

## Type Safety

The list blob is fully type-safe:

```typescript
interface User {
  id: number;
  name: string;
}

const users = createListBlob<User>();
container.register(users, () => []);

users.push({ id: 1, name: 'Alice' }); // ✓ OK
users.push({ id: 2 });                 // ✗ Error: missing 'name'
users.push('invalid');                 // ✗ Error: wrong type

const user: User = users[0];           // ✓ Type is User
const names = users.map(u => u.name);  // ✓ Type is string[]
```

## Immutability

Mutations create new array instances:

```typescript
const list = createListBlob<number>();
container.register(list, () => [1, 2, 3]);

const snapshot = [...list];
list.push(4);

console.log(snapshot);  // [1, 2, 3] - unchanged
console.log([...list]); // [1, 2, 3, 4] - new array
```

## Error Handling

```typescript
const list = createListBlob<string>();

// ✗ Error: Must register before use
list.push('item'); // Error: Array blob must be registered...

// ✓ Register first
container.register(list, () => []);
list.push('item'); // OK
```

## See Also

- [List Blobs Guide](/diblob/guide/list-blob) - Complete guide to list blobs
- [createBlob](/diblob/api/create-blob) - Create regular blobs
- [Reactive Dependencies](/diblob/guide/reactive-dependencies) - How invalidation works

