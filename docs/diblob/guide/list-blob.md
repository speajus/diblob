# List Blobs

**List blobs** are a special type of blob for managing arrays with automatic invalidation. When you mutate the array, all dependent blobs automatically receive a new array instance.

## How List Blobs Work

List blobs use a **copy-on-write** strategy to maintain immutability while providing a mutable-looking API:

1. **Proxy-based**: The list blob is a proxy that intercepts array operations
2. **Automatic invalidation**: Mutation methods (push, pop, etc.) create a new array and trigger re-initialization
3. **Dependency tracking**: Dependent blobs automatically receive the new array instance
4. **Transparent access**: Read operations work directly on the current array without overhead

### Key Behavior

- **Mutations create new arrays**: When you call `push()`, `pop()`, or other mutation methods, the list blob creates a new array internally and re-registers itself with the container
- **Immutable snapshots**: If you spread or copy the array (`[...list]`), that snapshot remains unchanged even after mutations
- **Synchronous only**: List blobs do not support async arrays (will throw an error)
- **Container required**: You must register the list blob with a container before any operations (read or write)

## Creating List Blobs

Use `createListBlob<T>()` to create a list blob:

```typescript
import { createListBlob, createContainer } from '@speajus/diblob';

const todoList = createListBlob<string>();
const container = createContainer();

// Register with initial array (can be empty or pre-populated)
container.register(todoList, () => []);
```

## Using List Blobs

List blobs act exactly like arrays - you can use them directly:

```typescript
// Add items
todoList.push('Buy groceries');
todoList.push('Walk the dog', 'Read a book');

// Access items
console.log(todoList[0]); // 'Buy groceries'
console.log(todoList.length); // 3

// Use array methods
const upperCase = todoList.map(item => item.toUpperCase());
const filtered = todoList.filter(item => item.includes('dog'));

// Iterate
for (const todo of todoList) {
  console.log(todo);
}
```

## Mutation Methods

All standard array mutation methods trigger automatic invalidation:

```typescript
// Adding items
todoList.push('item');           // Add to end
todoList.unshift('item');        // Add to beginning

// Removing items
todoList.pop();                  // Remove from end
todoList.shift();                // Remove from beginning
todoList.splice(1, 2);           // Remove 2 items at index 1

// Modifying
todoList.reverse();              // Reverse order
todoList.sort();                 // Sort items
todoList.fill('x', 0, 2);        // Fill range with value
todoList.copyWithin(0, 3, 5);    // Copy within array
```

## Immutability Through Re-initialization

When you mutate a list blob, it creates a **new array instance** rather than modifying in place:

```typescript
const list = createListBlob<number>();
container.register(list, () => [1, 2, 3]);

// Get a reference to the current array
const snapshot = [...list];

// Mutate the list
list.push(4);

// Snapshot is unchanged (immutability)
console.log(snapshot);  // [1, 2, 3]
console.log([...list]); // [1, 2, 3, 4]
```

## Reactive Dependencies

List blobs integrate with diblob's reactive dependency system:

```typescript
interface TodoCounter {
  count(): number;
}

const todoList = createListBlob<string>();
const counter = createBlob<TodoCounter>();

class TodoCounterImpl implements TodoCounter {
  constructor(private todos: string[]) {}
  count() { return this.todos.length; }
}

container.register(todoList, () => []);
container.register(counter, TodoCounterImpl, todoList);

console.log(counter.count()); // 0

todoList.push('Task 1');
console.log(counter.count()); // 1

todoList.push('Task 2', 'Task 3');
console.log(counter.count()); // 3
```

## Pre-initialized Arrays

You can initialize list blobs with existing data:

```typescript
const numbers = createListBlob<number>();
container.register(numbers, () => [1, 2, 3, 4, 5]);

console.log(numbers.length); // 5
console.log(numbers[0]);     // 1

// Mutations work on pre-initialized arrays
numbers.push(6);
console.log(numbers.length); // 6
```

## Read-Only Operations

All read-only array methods work without triggering invalidation:

```typescript
// These don't trigger invalidation
const doubled = list.map(x => x * 2);
const evens = list.filter(x => x % 2 === 0);
const sum = list.reduce((a, b) => a + b, 0);
const found = list.find(x => x > 10);
const index = list.indexOf(5);
const includes = list.includes(3);
const joined = list.join(', ');
const sliced = list.slice(1, 3);
```

## Use Cases

### 1. Managing Collections

```typescript
interface User {
  id: number;
  name: string;
}

const users = createListBlob<User>();
container.register(users, () => []);

// Add users
users.push({ id: 1, name: 'Alice' });
users.push({ id: 2, name: 'Bob' });

// Find and remove
const bobIndex = users.findIndex(u => u.name === 'Bob');
if (bobIndex !== -1) {
  users.splice(bobIndex, 1);
}
```

### 2. State Management

```typescript
interface AppState {
  notifications: string[];
}

const notifications = createListBlob<string>();
const appState = createBlob<AppState>();

class AppStateImpl implements AppState {
  constructor(public notifications: string[]) {}
}

container.register(notifications, () => []);
container.register(appState, AppStateImpl, notifications);

// Add notification
notifications.push('New message received');

// appState.notifications automatically updates!
```

### 3. Event Queues

```typescript
interface Event {
  type: string;
  data: any;
}

const eventQueue = createListBlob<Event>();
container.register(eventQueue, () => []);

// Add events
eventQueue.push({ type: 'click', data: { x: 100, y: 200 } });
eventQueue.push({ type: 'keypress', data: { key: 'Enter' } });

// Process and remove
while (eventQueue.length > 0) {
  const event = eventQueue.shift();
  processEvent(event);
}
```

## When to Use List Blobs

### ✅ Use List Blobs When:

1. **Managing dynamic collections** - User lists, shopping carts, notification queues, etc.
2. **State needs to trigger updates** - When adding/removing items should invalidate dependent blobs
3. **Array is a dependency** - When other blobs depend on the array and need automatic updates
4. **Frequent mutations** - When you're regularly adding, removing, or reordering items
5. **Need immutability guarantees** - When you want to ensure old references don't see new changes

### ❌ Don't Use List Blobs When:

1. **Static arrays** - If the array never changes, use a regular blob with `() => [...]`
2. **Computed arrays** - If the array is derived from other data, use a regular blob with a factory
3. **Performance-critical loops** - List blobs have proxy overhead; for hot paths, use regular arrays
4. **Complex nested mutations** - If you need to mutate items within the array (use regular blobs with immutable updates)
5. **Async operations** - List blobs don't support async arrays

### List Blob vs Regular Blob

```typescript
// ❌ Don't use list blob for static data
const staticList = createListBlob<string>();
container.register(staticList, () => ['a', 'b', 'c']); // Never mutated

// ✅ Use regular blob instead
const staticList = createBlob<string[]>();
container.register(staticList, () => ['a', 'b', 'c']);

// ❌ Don't use list blob for computed arrays
const doubled = createListBlob<number>();
container.register(doubled, (nums: number[]) => nums.map(n => n * 2), numbers);

// ✅ Use regular blob instead
const doubled = createBlob<number[]>();
container.register(doubled, (nums: number[]) => nums.map(n => n * 2), numbers);

// ✅ DO use list blob for mutable collections
const todos = createListBlob<string>();
container.register(todos, () => []);
todos.push('New task'); // Triggers invalidation
```

## Performance Considerations

### Proxy Overhead

List blobs use JavaScript Proxies, which add a small overhead to every property access:

```typescript
// Each access goes through the proxy
const item = list[0];        // Proxy overhead
const len = list.length;     // Proxy overhead
list.forEach(item => ...);   // Proxy overhead on each iteration
```

**Mitigation**: For performance-critical code, extract the array once:

```typescript
// ❌ Slow - proxy overhead on every access
for (let i = 0; i < list.length; i++) {
  processItem(list[i]);
}

// ✅ Fast - extract array once
const items = [...list];
for (let i = 0; i < items.length; i++) {
  processItem(items[i]);
}
```

### Copy-on-Write Cost

Every mutation creates a new array using the spread operator:

```typescript
// Each mutation copies the entire array
list.push(item);  // Creates [...current, item]
list.pop();       // Creates [...current] then pops
```

**Impact**: O(n) time and space for each mutation, where n is the array length.

**When this matters**:
- Large arrays (>1000 items)
- High-frequency mutations (>100/sec)
- Memory-constrained environments

**Alternatives for large datasets**:
- Use a regular blob with immutable update libraries (immer, immutable.js)
- Batch mutations and update once
- Use a different data structure (Map, Set)

## Common Patterns

### Batch Updates

Avoid triggering multiple invalidations:

```typescript
// ❌ Bad - triggers 3 invalidations
list.push('a');
list.push('b');
list.push('c');

// ✅ Good - triggers 1 invalidation
list.push('a', 'b', 'c');
```

### Conditional Mutations

Check before mutating to avoid unnecessary invalidations:

```typescript
// ❌ Bad - always triggers invalidation
list.splice(0, list.length); // Even if already empty

// ✅ Good - only invalidate if needed
if (list.length > 0) {
  list.splice(0, list.length);
}
```

### Filtering Items

```typescript
// Remove all items matching a condition
const toRemove = list
  .map((item, index) => ({ item, index }))
  .filter(({ item }) => shouldRemove(item))
  .reverse(); // Remove from end to avoid index shifting

for (const { index } of toRemove) {
  list.splice(index, 1);
}

// Or replace the entire array
const filtered = [...list].filter(item => !shouldRemove(item));
container.register(list, () => filtered);
```

### Updating Items

List blobs don't detect mutations to items within the array:

```typescript
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const todos = createListBlob<Todo>();

// ❌ This does NOT trigger invalidation
todos[0].done = true;

// ✅ Replace the item to trigger invalidation
const index = todos.findIndex(t => t.id === targetId);
if (index !== -1) {
  const updated = { ...todos[index], done: true };
  todos.splice(index, 1, updated);
}
```

## Error Handling

### Not Registered

```typescript
const list = createListBlob<string>();

// ❌ Error: "Array blob must be registered with a container before use"
list.push('item');

// ✅ Register first
container.register(list, () => []);
list.push('item'); // Works
```

### Async Arrays

```typescript
// ❌ Error: "Array blob does not support async arrays"
container.register(list, async () => {
  const data = await fetchData();
  return data;
});

// ✅ Use a regular blob for async data
const asyncList = createBlob<string[]>();
container.register(asyncList, async () => {
  const data = await fetchData();
  return data;
});
```

## Advanced: Direct Re-registration

You can bypass mutation methods and re-register directly:

```typescript
const list = createListBlob<number>();
container.register(list, () => [1, 2, 3]);

// Directly re-register with a new array
const newArray = [4, 5, 6];
container.register(list, () => newArray);

// This is equivalent to replacing the entire array
// Useful for bulk updates or external data sources
```

## Next Steps

- [Reactive Dependencies](/diblob/guide/reactive-dependencies) - How invalidation works
- [Blobs](/diblob/guide/blobs) - Core blob concepts
- [Containers](/diblob/guide/containers) - Container management

