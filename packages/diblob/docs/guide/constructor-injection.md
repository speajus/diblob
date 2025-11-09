# Constructor Injection

One of diblob's most powerful features is using blobs as default parameters for automatic constructor injection.

## Basic Usage

Use blobs as default parameters in your constructor:

```typescript
const logger = createBlob<Logger>();

class MyService {
  constructor(private logger = logger) {}
  
  doSomething() {
    this.logger.log('Doing something');
  }
}

// Register the blob
container.register(logger, ConsoleLogger);

// Resolve the class - blob is automatically injected!
const service = await container.resolve(MyService);
service.doSomething(); // Uses ConsoleLogger
```

## How It Works

The container uses a clever technique to detect blob dependencies:

1. Creates a singleton tracking array
2. Instantiates the class with no arguments
3. Each blob's default parameter executes and pushes itself to the tracking array
4. The container reads which blobs were accessed
5. Resolves those blobs and creates the final instance with resolved dependencies

```typescript
class MyService {
  constructor(
    private logger = loggerBlob,  // Pushes loggerBlob to tracking array
    private database = databaseBlob  // Pushes databaseBlob to tracking array
  ) {}
}

// Container detects: [loggerBlob, databaseBlob]
// Resolves both and creates: new MyService(loggerInstance, databaseInstance)
```

## Multiple Dependencies

You can have multiple blob dependencies:

```typescript
class UserService {
  constructor(
    private logger = loggerBlob,
    private database = databaseBlob,
    private cache = cacheBlob
  ) {}
}

// All three blobs are automatically detected and resolved
const service = await container.resolve(UserService);
```

## Mixing Blobs and Regular Parameters

You can mix blob default parameters with regular parameters:

```typescript
class ApiClient {
  constructor(
    private logger = loggerBlob,
    private baseUrl: string,
    private timeout: number = 5000
  ) {}
}

// When resolving, provide non-blob parameters
const client = await container.resolve(ApiClient, 'https://api.example.com', 3000);
```

## Property Injection

Blobs also work as property initializers:

```typescript
class MyService {
  private logger = loggerBlob;
  private database = databaseBlob;
  
  doSomething() {
    this.logger.log('Doing something');
    this.database.query('SELECT * FROM users');
  }
}

const service = await container.resolve(MyService);
```

## Without Registering the Class

The class itself doesn't need to be registered as a blob:

```typescript
class MyService {
  constructor(private logger = loggerBlob) {}
}

// MyService is NOT registered, but container.resolve still works!
const service = await container.resolve(MyService);
```

This is different from registering the class as a blob:

```typescript
const myService = createBlob<MyService>();

// Register the blob
container.register(myService, MyService, loggerBlob);

// Use the blob directly
myService.doSomething();
```

## Async Dependencies

Constructor injection works with async blobs:

```typescript
class MyService {
  constructor(
    private logger = loggerBlob,
    private database = databaseBlob  // async blob
  ) {}
}

// Container automatically handles async dependencies
const service = await container.resolve(MyService);
```

## Type Safety

TypeScript ensures type safety:

```typescript
const logger = createBlob<Logger>();

class MyService {
  constructor(private logger = logger) {}
  
  doSomething() {
    // TypeScript knows logger has log() method
    this.logger.log('Hello');
    
    // TypeScript catches errors
    this.logger.notAMethod(); // ✗ Error
  }
}
```

## Benefits

### 1. No Manual Wiring

You don't need to manually wire dependencies:

```typescript
// ✗ Without constructor injection
const logger = container.resolve(loggerBlob);
const database = container.resolve(databaseBlob);
const service = new MyService(logger, database);

// ✓ With constructor injection
const service = await container.resolve(MyService);
```

### 2. Clear Dependencies

Dependencies are visible in the constructor:

```typescript
class MyService {
  constructor(
    private logger = loggerBlob,
    private database = databaseBlob
  ) {}
  // Clear: MyService depends on logger and database
}
```

### 3. Easy Testing

Easy to provide test doubles:

```typescript
// Production
const service = await container.resolve(MyService);

// Testing
const service = new MyService(mockLogger, mockDatabase);
```

## Best Practices

### 1. Use Constructor Injection for Required Dependencies

```typescript
// ✓ Good - required dependencies in constructor
class MyService {
  constructor(
    private logger = loggerBlob,
    private database = databaseBlob
  ) {}
}

// ✗ Avoid - optional dependencies in constructor
class MyService {
  private logger?: Logger;
  
  setLogger(logger: Logger) {
    this.logger = logger;
  }
}
```

### 2. Keep Constructors Simple

Don't do work in constructors:

```typescript
// ✗ Avoid - work in constructor
class MyService {
  constructor(private database = databaseBlob) {
    this.database.connect(); // Side effect!
  }
}

// ✓ Better - separate initialization
class MyService {
  constructor(private database = databaseBlob) {}
  
  async initialize() {
    await this.database.connect();
  }
}
```

### 3. Limit Constructor Parameters

Keep the number of dependencies reasonable:

```typescript
// ✗ Avoid - too many dependencies
class MyService {
  constructor(
    private dep1 = blob1,
    private dep2 = blob2,
    private dep3 = blob3,
    private dep4 = blob4,
    private dep5 = blob5,
    private dep6 = blob6
  ) {}
}

// ✓ Better - refactor or use facade
class MyService {
  constructor(
    private logger = loggerBlob,
    private dataAccess = dataAccessBlob  // Facade for multiple data services
  ) {}
}
```

## Next Steps

- [Factory Injection](/guide/factory-injection) - Alternative injection pattern using factory functions
- [Dependency Resolution](/guide/dependency-resolution) - How dependencies are resolved
- [Async Support](/guide/async-support) - Async dependencies

