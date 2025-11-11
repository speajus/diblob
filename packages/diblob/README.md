# diblob

A dependency injection framework where the **proxy (blob) is the key**. Pass around the blob, and it will act like the interface you assign to it. [docs](https://speajus.github.io/diblob/)

## Key Features

- **Blob as Key**: The proxy itself is both the identifier and the interface
- **Automatic Dependency Resolution**: Dependencies are automatically inspected and resolved
- **Reactive Dependencies**: When a blob is re-registered, all dependents automatically update
- **Lifecycle Hooks**: Initialize and dispose hooks for resource management
- **Async Support**: Full support for async factories and async resolution
- **Container Nesting & Merging**: Create child containers or merge multiple containers
- **Constructor & Property Injection**: Blobs work as default parameters and property initializers
- **Type-Safe**: Full TypeScript support with type inference

## Installation

```bash
npm install @speajus/diblob
```

## Quick Start

```typescript
import { createBlob, createContainer } from '@speajus/diblob';

// 1. Define your interfaces
interface UserService {
  getUser(id: number): User;
}

// 2. Create blobs
const userService = createBlob<UserService>();
const logger = createBlob<Logger>();
const database = createBlob<Database>();

// 3. Create a container and register blobs with their dependencies
const container = createContainer();
container.register(logger, ConsoleLogger);
container.register(database, DatabaseImpl);
container.register(userService, UserServiceImpl, logger, database);

// 4. Use the blob directly - it acts as UserService!
const user = userService.getUser(123);
```

## Core Concepts

### Blobs

A **blob** is a proxy object that serves as both:
- A unique identifier for the dependency
- The interface/type that consumers interact with

```typescript
const logger = createBlob<Logger>();
const database = createBlob<Database>();
```

### Container

The container manages blob registrations and automatically resolves dependencies:

```typescript
const container = createContainer();

// Register with a constructor (no dependencies)
container.register(logger, ConsoleLogger);

// Register with a constructor and blob dependencies
// Dependencies are automatically inspected and resolved!
container.register(userService, UserServiceImpl, logger, database);

// You can also use factory functions
container.register(config, () => new ConfigImpl());

// Factory functions can receive injected dependencies
container.register(service, (log: Logger, db: Database) => {
  return new ServiceImpl(log, db);
}, logger, database);

// Mix blob dependencies with plain values
container.register(service, ServiceImpl, logger, "production", 8080);
```

### Reactive Dependencies

When a blob's registration changes, all dependent blobs automatically invalidate and recalculate:

```typescript
// Initial registration
container.register(logger, ConsoleLogger);
container.register(userService, UserServiceImpl, logger);

// Use the service
userService.doSomething(); // Uses ConsoleLogger

// Re-register logger with new implementation
container.register(logger, FileLogger);

// userService automatically uses the new logger!
userService.doSomething(); // Now uses FileLogger
```

### Constructor & Property Injection

Blobs can be used as default parameters in constructors or as property initializers:

```typescript
// Constructor parameter with default blob
class MyService {
  constructor(private logger = loggerBlob) {}

  doSomething() {
    this.logger.log('Doing something');
  }
}

// Property initialization with blob
class AnotherService {
  private logger = loggerBlob;

  doSomething() {
    this.logger.log('Doing something');
  }
}

// Both work automatically!
const service = new MyService();
service.doSomething(); // Uses the registered logger
```

### Async Resolution

Full support for async factories and async dependency resolution:

```typescript
// Async factory
container.register(myBlob, async () => {
  const data = await fetchData();
  return new MyImpl(data);
});

// Resolve async
const instance = await container.resolve(myBlob);

// Or use directly (returns Promise)
await myBlob.someMethod();

// Async dependencies are handled automatically
class MyService {
  constructor(private asyncDep = asyncBlob) {}
}

const service = await container.resolve(MyService);
```

### Container Nesting & Merging

Create hierarchical container structures or merge multiple containers:

```typescript
// Nesting - child inherits from parent
const parent = createContainer();
parent.register(sharedBlob, SharedImpl);

const child = createContainer(parent);
child.register(childBlob, ChildImpl);

// child can resolve both sharedBlob and childBlob
// parent can only resolve sharedBlob

// Merging - combine multiple containers
const c1 = createContainer();
const c2 = createContainer();

c1.register(blob1, Impl1);
c2.register(blob2, Impl2);

const merged = createContainer(c1, c2);
// merged can resolve both blob1 and blob2
// Last parent wins for conflicts
```

## API Reference

### `createBlob<T>()`

Creates a new blob that acts as type `T`.

```typescript
const service = createBlob<MyService>();
```

### `createContainer(...parents)`

Creates a new DI container. Optionally accepts parent containers for nesting or merging.

```typescript
// Simple container
const container = createContainer();

// Nested container (child inherits from parent)
const parent = createContainer();
const child = createContainer(parent);

// Merged containers (last parent wins for conflicts)
const container1 = createContainer();
const container2 = createContainer();
const merged = createContainer(container1, container2);
```

### `container.register<T>(blob, factory, ...deps)`

Registers a blob with a factory/constructor and its dependencies.

**Parameters:**
- `blob`: The blob to register
- `factory`: Constructor or factory function
- `...deps`: Dependencies to inject (blobs are auto-resolved, plain values passed as-is)
  - Last argument can be `{ lifecycle: Lifecycle }` for options

```typescript
// With constructor and dependencies
container.register(myService, MyServiceImpl, logger, database);

// With factory function
container.register(config, () => new ConfigImpl());

// With lifecycle option
container.register(
  myService,
  MyServiceImpl,
  logger,
  { lifecycle: Lifecycle.Transient }
);
```

### `container.resolve<T>(blobOrConstructor)`

Manually resolve a blob or class constructor to its instance.

**For blobs** (usually not needed - just use the blob directly):
```typescript
const instance = container.resolve(myService);
```

**For unregistered classes** (automatically detects and resolves blob default parameters):
```typescript
class MyClass {
  constructor(private service = myBlob) {}
}

// MyClass is NOT registered as a blob, but container.resolve still works!
const instance = await container.resolve(MyClass);

// How it works:
// 1. Container tracks blob accesses during constructor execution
// 2. Each blob pushes itself into a singleton tracking array
// 3. Container resolves those blobs and handles async dependencies
// 4. Returns the instantiated class with all dependencies resolved
```

**Async resolution**:
```typescript
// Async factory
container.register(myBlob, async () => new MyImpl());

// Resolve returns a Promise
const instance = await container.resolve(myBlob);

// Or use the blob directly (returns Promise)
await myBlob.someMethod();
```

### `container.has<T>(blob)`

Check if a blob is registered.

```typescript
if (container.has(myService)) {
  // ...
}
```

### `container.unregister<T>(blob)`

Unregister a blob.

```typescript
container.unregister(myService);
```

### `container.clear()`

Clear all registrations.

```typescript
container.clear();
```

## Lifecycle

### Singleton (default)

Creates one instance and reuses it:

```typescript
container.register(service, () => new ServiceImpl());
// or explicitly:
container.register(service, () => new ServiceImpl(), {
  lifecycle: Lifecycle.Singleton
});
```

### Transient

Creates a new instance every time:

```typescript
container.register(service, () => new ServiceImpl(), {
  lifecycle: Lifecycle.Transient
});
```

## Comparison with pbj

| Feature | pbj | diblob |
|---------|-----|--------|
| Key | Separate token/key | The blob itself |
| Usage | `container.resolve(key)` | Use blob directly |
| Type safety | Token must match type | Blob IS the type |
| Reactivity | Manual | Automatic |

## License

MIT

