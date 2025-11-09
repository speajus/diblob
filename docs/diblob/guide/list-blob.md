# List Blobs

**List blobs** are a special type of blob for managing arrays with automatic invalidation. When you mutate the array, all dependent blobs automatically receive a new array instance.

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

## Next Steps

- [Reactive Dependencies](/diblob/guide/reactive-dependencies) - How invalidation works
- [Blobs](/diblob/guide/blobs) - Core blob concepts
- [Containers](/diblob/guide/containers) - Container management

