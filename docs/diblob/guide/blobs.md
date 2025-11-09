# Blobs

A **blob** is the core concept in diblob. It's a proxy object that serves as both:
- A unique identifier for the dependency
- The interface/type that consumers interact with

## Creating Blobs

Use `createBlob<T>()` to create a blob:

```typescript
import { createBlob } from '@speajus/diblob';

interface Logger {
  log(message: string): void;
}

const logger = createBlob<Logger>();
```

The type parameter `<Logger>` tells TypeScript what interface the blob represents.

## Using Blobs

Once a blob is registered in a container, you can use it directly:

```typescript
// Register the blob
container.register(logger, ConsoleLogger);

// Use it directly - it acts as Logger!
logger.log('Hello, world!');
```

All method calls, property accesses, and other operations are forwarded to the registered implementation.

## Blob Identity

Each blob has a unique identity. Two blobs are never equal, even if they have the same type:

```typescript
const logger1 = createBlob<Logger>();
const logger2 = createBlob<Logger>();

console.log(logger1 === logger2); // false
```

This is important because the blob itself is the key in the container.

## Checking if Something is a Blob

You can check if an object is a blob using `isBlob()`:

```typescript
import { isBlob } from '@speajus/diblob';

const logger = createBlob<Logger>();
const notABlob = new ConsoleLogger();

console.log(isBlob(logger));    // true
console.log(isBlob(notABlob));  // false
```

## Getting Blob ID

Each blob has an internal ID. You can retrieve it using `getBlobId()`:

```typescript
import { getBlobId } from '@speajus/diblob's/diblob';

const logger = createBlob<Logger>();
const id = getBlobId(logger);
console.log(id); // number
```

This is mainly useful for debugging and internal operations.

## Blobs as Dependencies

Blobs can be passed as dependencies when registering other blobs:

```typescript
const logger = createBlob<Logger>();
const database = createBlob<Database>();
const userService = createBlob<UserService>();

container.register(logger, ConsoleLogger);
container.register(database, DatabaseImpl, logger);
container.register(userService, UserServiceImpl, logger, database);
```

The container automatically recognizes blobs and resolves them to their registered implementations.

## Blobs as Default Parameters

One of the most powerful features is using blobs as default parameters:

```typescript
class MyService {
  constructor(private logger = loggerBlob) {}
  
  doSomething() {
    this.logger.log('Doing something');
  }
}

// The container can resolve this automatically!
const service = await container.resolve(MyService);
```

See [Constructor Injection](/diblob/guide/constructor-injection) for more details.

## Type Safety

Blobs are fully type-safe. TypeScript knows the exact type:

```typescript
const logger = createBlob<Logger>();

// TypeScript knows logger has a log() method
logger.log('Hello'); // ✓ OK

// TypeScript catches errors
logger.notAMethod(); // ✗ Error: Property 'notAMethod' does not exist
```

## Blob Lifecycle

Blobs themselves are just proxies - they don't have a lifecycle. The lifecycle is controlled by the container registration:

```typescript
import { Lifecycle } from '@speajus/diblob';

// Singleton (default) - one instance
container.register(logger, ConsoleLogger);

// Transient - new instance each time
container.register(logger, ConsoleLogger, { lifecycle: Lifecycle.Transient });
```

See [Lifecycle Management](/diblob/guide/lifecycle) for more details.

## Best Practices

### 1. Create Blobs at Module Level

Create blobs at the module level so they can be imported and shared:

```typescript
// services/logger.ts
export const logger = createBlob<Logger>();

// services/user-service.ts
import { logger } from './logger';
export const userService = createBlob<UserService>();
```

### 2. Use Descriptive Names

Name your blobs clearly to indicate what they represent:

```typescript
// Good
const userService = createBlob<UserService>();
const emailSender = createBlob<EmailSender>();

// Avoid
const blob1 = createBlob<UserService>();
const x = createBlob<EmailSender>();
```

### 3. Keep Interfaces Focused

Design focused interfaces for your blobs:

```typescript
// Good - focused interface
interface Logger {
  log(message: string): void;
  error(message: string): void;
}

// Avoid - too many responsibilities
interface SuperService {
  log(message: string): void;
  sendEmail(to: string): void;
  queryDatabase(sql: string): any[];
  // ... too much!
}
```

## Next Steps

- [Containers](/diblob/guide/containers) - Learn how to register and manage blobs
- [Dependency Resolution](/diblob/guide/dependency-resolution) - Understand how dependencies are resolved
- [Constructor Injection](/diblob/guide/constructor-injection) - Use blobs as default parameters

