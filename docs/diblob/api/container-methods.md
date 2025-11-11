# Container Methods

Methods available on Container instances.

## register

Register a blob with its implementation.

### Signature

```typescript
register<T>(
  blob: Blob<T>,
  factory: Factory<T>,
  ...deps: any[]
): void
```

### Parameters

- `blob` - The blob to register
- `factory` - Constructor or factory function that creates instances of type T
  - Can be a class constructor: `new (...args: any[]) => T`
  - Can be a factory function: `(...args: any[]) => T`
  - Can be an async factory: `(...args: any[]) => Promise<T>`
- `...deps` - Dependencies to pass to the factory
  - Can be blobs (automatically resolved)
  - Can be plain values (passed as-is)
  - Last argument can be `{ lifecycle: Lifecycle }` for lifecycle options

### Dependency Injection

Dependencies listed in `...deps` are resolved and passed to the factory function as parameters:

```typescript
// Factory receives resolved dependencies as parameters
container.register(service, (log: Logger, db: Database) => {
  return new ServiceImpl(log, db);
}, logger, database);
```

The container automatically:
1. Resolves each blob dependency to its instance
2. Passes plain values as-is
3. Calls the factory with all resolved dependencies
4. Handles async dependencies (returns Promise if any dependency is async)

### Examples

#### Basic Registration

```typescript
// With constructor (no dependencies)
container.register(logger, ConsoleLogger);

// With constructor and dependencies
container.register(userService, UserServiceImpl, logger, database);

// With factory function (no dependencies)
container.register(config, () => new ConfigImpl());
```

#### Factory Injection

```typescript
// Factory with single blob dependency
container.register(service, (log: Logger) => ({
  doWork: () => log.log('working')
}), logger);

// Factory with multiple blob dependencies
container.register(service, (log: Logger, db: Database) => {
  return new ServiceImpl(log, db);
}, logger, database);

// Factory with mixed blob and plain dependencies
container.register(apiClient, (log: Logger, baseUrl: string, timeout: number) => {
  return new ApiClient(baseUrl, timeout, log);
}, logger, 'https://api.example.com', 5000);
```

#### Async Factories

```typescript
// Async factory with dependencies
container.register(database, async (cfg: Config, log: Logger) => {
  const db = new DatabaseImpl(cfg.getConnectionString());
  await db.connect();
  log.log('Database connected');
  return db;
}, config, logger);
```

#### Lifecycle Options

```typescript
// Singleton (default)
container.register(logger, ConsoleLogger);

// Transient - creates new instance each time
container.register(logger, ConsoleLogger, { lifecycle: Lifecycle.Transient });

// With dependencies and lifecycle
container.register(service, (log: Logger) => new ServiceImpl(log), logger, {
  lifecycle: Lifecycle.Transient
});
```

#### Lifecycle Hooks

```typescript
import { Lifecycle } from '@speajus/diblob';

// Initialize hook - called after instance creation
container.register(database, DatabaseImpl, {
  lifecycle: Lifecycle.Singleton,
  initialize: 'initialize' // Method name
});

// Dispose hook - called when instance is invalidated
container.register(database, DatabaseImpl, {
  lifecycle: Lifecycle.Singleton,
  dispose: 'dispose' // Method name
});

// Using functions with instance parameter instead of method names
container.register(database, DatabaseImpl, {
  lifecycle: Lifecycle.Singleton,
  initialize: async (instance: DatabaseImpl) => await instance.connect(),
  dispose: async (instance: DatabaseImpl) => await instance.close()
});

// Combine all options
container.register(database, DatabaseImpl, {
  lifecycle: Lifecycle.Singleton,
  initialize: 'initialize',
  dispose: 'dispose'
});
```

**Note**: Including the `lifecycle` property is recommended when using lifecycle hooks, as it helps TypeScript correctly discriminate the options type.

## resolve

Resolve a blob or class to its instance.

### Signature

```typescript
resolve<T>(blobOrConstructor: Blob<T> | (new (...args: any[]) => T)): Promise<T>
```

### Parameters

- `blobOrConstructor` - Blob or class constructor to resolve

### Returns

`Promise<T>` - The resolved instance

### Examples

```typescript
// Resolve blob
const logger = await container.resolve(loggerBlob);

// Resolve class with blob dependencies
class MyService {
  constructor(private logger = loggerBlob) {}
}
const service = await container.resolve(MyService);
```

## has

Check if a blob is registered.

### Signature

```typescript
has<T>(blob: Blob<T>): boolean
```

### Parameters

- `blob` - The blob to check

### Returns

`boolean` - True if registered, false otherwise

### Example

```typescript
if (container.has(logger)) {
  console.log('Logger is registered');
}
```

## unregister

Unregister a blob.

### Signature

```typescript
unregister<T>(blob: Blob<T>): void
```

### Parameters

- `blob` - The blob to unregister

### Example

```typescript
container.unregister(logger);
```

## clear

Clear all registrations.

### Signature

```typescript
clear(): void
```

### Example

```typescript
container.clear();
```

## See Also

- [Containers Guide](/diblob/guide/containers) - Comprehensive guide
- [Factory Injection Guide](/diblob/guide/factory-injection) - Factory function dependency injection
- [API Reference](/diblob/api/) - Full API reference

