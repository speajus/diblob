# Reactive Dependencies

One of diblob's most powerful features is **reactive dependencies**. When a blob's registration changes, all dependent blobs automatically update.

## How It Works

When you re-register a blob, the container:
1. Invalidates all blobs that depend on it
2. Invalidates their dependents recursively
3. Next time a blob is accessed, it's re-resolved with the new implementation

```typescript
// Initial registration
container.register(logger, ConsoleLogger);
container.register(userService, UserServiceImpl, logger);

// Use the service
userService.getUser(123); // Uses ConsoleLogger

// Re-register logger
container.register(logger, FileLogger);

// userService automatically uses the new logger!
userService.getUser(456); // Uses FileLogger
```

## Dependency Tracking

The container automatically tracks dependencies:

```typescript
container.register(logger, ConsoleLogger);
container.register(database, DatabaseImpl, logger);
container.register(userService, UserServiceImpl, logger, database);

// Dependency graph:
// userService → logger, database
// database → logger
```

When `logger` is re-registered, both `database` and `userService` are invalidated.

## Cascading Updates

Updates cascade through the dependency graph:

```typescript
container.register(logger, ConsoleLogger);
container.register(database, DatabaseImpl, logger);
container.register(cache, CacheImpl, logger);
container.register(userService, UserServiceImpl, database, cache);

// Re-register logger
container.register(logger, FileLogger);

// All of these are invalidated and will use FileLogger:
// - database (direct dependent)
// - cache (direct dependent)
// - userService (indirect dependent through database and cache)
```

## Use Cases

### 1. Hot Reloading

Update implementations without restarting:

```typescript
// Development mode
if (isDevelopment) {
  watchFiles(['./services/**/*.ts'], (changedFile) => {
    const newImpl = require(changedFile).default;
    container.register(serviceBlob, newImpl);
    // All dependents automatically update!
  });
}
```

### 2. Feature Flags

Switch implementations based on feature flags:

```typescript
const paymentService = createBlob<PaymentService>();

if (featureFlags.newPaymentProvider) {
  container.register(paymentService, NewPaymentService);
} else {
  container.register(paymentService, OldPaymentService);
}

// Later, when flag changes
featureFlags.onChange('newPaymentProvider', (enabled) => {
  if (enabled) {
    container.register(paymentService, NewPaymentService);
  } else {
    container.register(paymentService, OldPaymentService);
  }
  // All services using paymentService automatically update!
});
```

### 3. A/B Testing

Switch implementations for different user groups:

```typescript
function setupUserContainer(user: User) {
  const container = createContainer(baseContainer);
  
  if (user.isInTestGroup('new-ui')) {
    container.register(uiService, NewUIService);
  } else {
    container.register(uiService, OldUIService);
  }
  
  return container;
}
```

### 4. Environment-Specific Implementations

```typescript
const emailService = createBlob<EmailService>();

if (process.env.NODE_ENV === 'production') {
  container.register(emailService, SendGridEmailService);
} else {
  container.register(emailService, MockEmailService);
}
```

## Performance Considerations

### Lazy Re-Resolution

Blobs are only re-resolved when accessed:

```typescript
container.register(logger, ConsoleLogger);
container.register(service, ServiceImpl, logger);

// Re-register logger
container.register(logger, FileLogger);

// service is invalidated but NOT re-resolved yet

// Re-resolution happens here
service.doSomething(); // Now service is re-created with FileLogger
```

### Singleton Caching

Singleton instances are cached until invalidated:

```typescript
container.register(logger, ConsoleLogger);

logger.log('A'); // Creates instance
logger.log('B'); // Reuses same instance
logger.log('C'); // Reuses same instance

container.register(logger, FileLogger);

logger.log('D'); // Creates new instance
logger.log('E'); // Reuses new instance
```

## Transient Lifecycle

Transient blobs are always re-created, so they don't benefit from caching:

```typescript
import { Lifecycle } from '@speajus/diblob';

container.register(logger, ConsoleLogger, { lifecycle: Lifecycle.Transient });

logger.log('A'); // Creates instance
logger.log('B'); // Creates NEW instance
logger.log('C'); // Creates NEW instance
```

## Best Practices

### 1. Minimize Re-Registrations

Re-registrations invalidate dependents, so minimize them:

```typescript
// ✗ Avoid - re-registering in a loop
for (const config of configs) {
  container.register(service, ServiceImpl, config);
  service.doSomething();
}

// ✓ Better - register once
const config = selectConfig(configs);
container.register(service, ServiceImpl, config);
for (const item of items) {
  service.doSomething();
}
```

### 2. Use Child Containers for Temporary Changes

```typescript
// ✗ Avoid - modifying shared container
container.register(logger, TestLogger);
runTests();
container.register(logger, ProductionLogger);

// ✓ Better - use child container
const testContainer = createContainer(container);
testContainer.register(logger, TestLogger);
runTests(testContainer);
// Original container unchanged
```

### 3. Be Aware of Side Effects

Re-registration can trigger side effects in constructors:

```typescript
class DatabaseImpl {
  constructor() {
    console.log('Connecting to database...');
    this.connect();
  }
}

container.register(database, DatabaseImpl);
// "Connecting to database..."

container.register(database, DatabaseImpl);
// "Connecting to database..." (again!)
```

## Next Steps

- [Async Support](/guide/async-support) - Async dependencies
- [Lifecycle Management](/guide/lifecycle) - Control instance lifecycles
- [Container Nesting](/guide/container-nesting) - Hierarchical containers

