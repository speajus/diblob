# Dependency Resolution

diblob automatically inspects and resolves dependencies when you register blobs.

## How It Works

When you register a blob with dependencies:

```typescript
container.register(userService, UserServiceImpl, logger, database);
```

The container:
1. Identifies which arguments are blobs (using `isBlob()`)
2. Resolves each blob to its registered implementation
3. Passes the resolved instances to the constructor
4. Caches the result (for Singleton lifecycle)

## Blob vs Non-Blob Dependencies

The container distinguishes between blob and non-blob dependencies:

```typescript
// Blobs are resolved
container.register(service, ServiceImpl, loggerBlob, databaseBlob);

// Plain values are passed as-is
container.register(apiClient, ApiClient, "https://api.example.com", 3000);

// Mix both
container.register(service, ServiceImpl, loggerBlob, "production", 8080);
```

## Automatic Constructor Inspection

For classes with blob default parameters, the container automatically detects dependencies:

```typescript
class MyService {
  constructor(
    private logger = loggerBlob,
    private database = databaseBlob
  ) {}
}

// Container detects logger and database dependencies
const service = await container.resolve(MyService);
```

### How Constructor Detection Works

The container uses a clever technique:
1. Creates a singleton tracking array
2. Instantiates the class with no arguments
3. Each blob's default parameter executes and pushes itself to the tracking array
4. The container reads which blobs were accessed
5. Resolves those blobs and creates the final instance

## Dependency Order

Dependencies are resolved in the order they're declared:

```typescript
class ServiceImpl {
  constructor(
    public logger: Logger,
    public database: Database,
    public cache: Cache
  ) {}
}

container.register(service, ServiceImpl, logger, database, cache);
// logger → position 0
// database → position 1
// cache → position 2
```

## Circular Dependencies

diblob detects circular dependencies and throws an error:

```typescript
// ✗ This will throw an error
container.register(blobA, ClassA, blobB);
container.register(blobB, ClassB, blobA);

// Attempting to resolve will throw:
// Error: Circular dependency detected: blobA -> blobB -> blobA
```

### Breaking Circular Dependencies

Use lazy resolution or factory functions:

```typescript
// Option 1: Lazy resolution
class ClassA {
  constructor(private getBlobB: () => BlobB) {}
  
  useB() {
    const b = this.getBlobB();
    b.doSomething();
  }
}

container.register(blobA, ClassA, () => blobB);

// Option 2: Setter injection
class ClassA {
  private blobB?: BlobB;
  
  setBlobB(b: BlobB) {
    this.blobB = b;
  }
}
```

## Lazy Resolution

Sometimes you want to defer resolution until later:

```typescript
class MyService {
  constructor(private getLogger: () => Logger) {}
  
  doSomething() {
    const logger = this.getLogger();
    logger.log('Lazy resolution!');
  }
}

container.register(service, MyService, () => logger);
```

## Resolution Errors

The container throws errors for common issues:

### Unregistered Blob

```typescript
const logger = createBlob<Logger>();
// Forgot to register!

logger.log('Hello'); // Error: Blob not registered
```

### Wrong Number of Dependencies

```typescript
class ServiceImpl {
  constructor(logger: Logger, database: Database) {}
}

// ✗ Wrong - missing database
container.register(service, ServiceImpl, logger);
// Error: Expected 2 dependencies, got 1
```

## Best Practices

### 1. Register Dependencies First

Register dependencies before dependents:

```typescript
// ✓ Good
container.register(logger, ConsoleLogger);
container.register(database, DatabaseImpl, logger);
container.register(userService, UserServiceImpl, logger, database);

// ✗ Avoid (though it works, it's less clear)
container.register(userService, UserServiceImpl, logger, database);
container.register(logger, ConsoleLogger);
container.register(database, DatabaseImpl, logger);
```

### 2. Use Constructor Injection

Prefer constructor injection over property injection:

```typescript
// ✓ Good
class MyService {
  constructor(private logger: Logger) {}
}

// ✗ Avoid
class MyService {
  private logger?: Logger;
  
  setLogger(logger: Logger) {
    this.logger = logger;
  }
}
```

### 3. Keep Dependency Graphs Shallow

Avoid deep dependency chains:

```typescript
// ✗ Avoid - too deep
A → B → C → D → E → F

// ✓ Better - flatter structure
A → B, C
D → B, C
```

## Next Steps

- [Reactive Dependencies](/guide/reactive-dependencies) - Automatic updates
- [Async Support](/guide/async-support) - Async resolution
- [Constructor Injection](/guide/constructor-injection) - Default parameters

