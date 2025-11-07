# Lifecycle Management

diblob supports two lifecycle modes: **Singleton** (default) and **Transient**.

## Singleton Lifecycle

**Singleton** creates one instance and reuses it for all resolutions.

```typescript
import { Lifecycle } from 'diblob';

// Explicit singleton
container.register(logger, ConsoleLogger, { lifecycle: Lifecycle.Singleton });

// Or omit (singleton is default)
container.register(logger, ConsoleLogger);
```

### Behavior

```typescript
container.register(logger, ConsoleLogger);

const logger1 = await container.resolve(logger);
const logger2 = await container.resolve(logger);

console.log(logger1 === logger2); // true - same instance
```

### Use Cases

Use Singleton for:
- **Stateless services** (e.g., loggers, validators)
- **Shared resources** (e.g., database connections, caches)
- **Configuration** (e.g., app config, feature flags)
- **Expensive objects** (e.g., connection pools)

## Transient Lifecycle

**Transient** creates a new instance for every resolution.

```typescript
import { Lifecycle } from 'diblob';

container.register(logger, ConsoleLogger, { lifecycle: Lifecycle.Transient });
```

### Behavior

```typescript
container.register(logger, ConsoleLogger, { lifecycle: Lifecycle.Transient });

const logger1 = await container.resolve(logger);
const logger2 = await container.resolve(logger);

console.log(logger1 === logger2); // false - different instances
```

### Use Cases

Use Transient for:
- **Stateful objects** (e.g., request handlers, commands)
- **Short-lived objects** (e.g., DTOs, value objects)
- **Objects with per-use state** (e.g., builders, processors)

## Lifecycle with Dependencies

Dependencies follow their own lifecycle:

```typescript
// Logger is singleton
container.register(logger, ConsoleLogger);

// Service is transient, but logger is still singleton
container.register(service, ServiceImpl, logger, { lifecycle: Lifecycle.Transient });

const s1 = await container.resolve(service);
const s2 = await container.resolve(service);

console.log(s1 === s2);           // false - different services
console.log(s1.logger === s2.logger); // true - same logger
```

## Lifecycle Options

Pass lifecycle as the last argument:

```typescript
// No dependencies
container.register(logger, ConsoleLogger, { lifecycle: Lifecycle.Transient });

// With dependencies
container.register(service, ServiceImpl, logger, database, { lifecycle: Lifecycle.Transient });

// With factory
container.register(config, () => new Config(), { lifecycle: Lifecycle.Singleton });
```

## Singleton Caching

Singleton instances are cached until invalidated:

```typescript
container.register(logger, ConsoleLogger);

logger.log('A'); // Creates instance
logger.log('B'); // Reuses instance
logger.log('C'); // Reuses instance

// Re-register invalidates cache
container.register(logger, FileLogger);

logger.log('D'); // Creates new instance
logger.log('E'); // Reuses new instance
```

## Transient and Re-Registration

Transient blobs are never cached, so re-registration doesn't affect existing instances:

```typescript
container.register(logger, ConsoleLogger, { lifecycle: Lifecycle.Transient });

const logger1 = await container.resolve(logger);

// Re-register
container.register(logger, FileLogger, { lifecycle: Lifecycle.Transient });

const logger2 = await container.resolve(logger);

// logger1 is still ConsoleLogger
// logger2 is FileLogger
```

## Best Practices

### 1. Default to Singleton

Use Singleton unless you have a specific reason for Transient:

```typescript
// ✓ Good - singleton for stateless service
container.register(logger, LoggerService);

// ✗ Avoid - unnecessary transient
container.register(logger, LoggerService, { lifecycle: Lifecycle.Transient });
```

### 2. Use Transient for Stateful Objects

```typescript
// ✓ Good - transient for stateful command
container.register(command, ProcessOrderCommand, { lifecycle: Lifecycle.Transient });

// ✗ Avoid - singleton for stateful object
container.register(command, ProcessOrderCommand); // State leaks between uses!
```

### 3. Be Careful with Singleton State

Singleton instances are shared, so be careful with mutable state:

```typescript
// ✗ Dangerous - shared mutable state
class CounterService {
  private count = 0;
  
  increment() {
    this.count++;
  }
}

container.register(counter, CounterService); // Singleton

// All users share the same count!
```

### 4. Consider Memory Usage

Transient instances are created frequently, so consider memory:

```typescript
// ✗ Avoid - creates many large objects
class HugeService {
  private data = new Array(1000000);
}

container.register(huge, HugeService, { lifecycle: Lifecycle.Transient });

// ✓ Better - singleton for large objects
container.register(huge, HugeService);
```

## Lifecycle and Async

Lifecycle works the same for async blobs:

```typescript
// Singleton async
container.register(database, async () => {
  const conn = await createConnection();
  return new DatabaseImpl(conn);
});

const db1 = await container.resolve(database);
const db2 = await container.resolve(database);
console.log(db1 === db2); // true

// Transient async
container.register(database, async () => {
  const conn = await createConnection();
  return new DatabaseImpl(conn);
}, { lifecycle: Lifecycle.Transient });

const db3 = await container.resolve(database);
const db4 = await container.resolve(database);
console.log(db3 === db4); // false
```

## Next Steps

- [Constructor Injection](/guide/constructor-injection) - Default parameters
- [Reactive Dependencies](/guide/reactive-dependencies) - Automatic updates

