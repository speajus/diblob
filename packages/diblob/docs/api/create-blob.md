# createBlob

Creates a new blob that acts as type `T`.

## Signature

```typescript
function createBlob<T>(): Blob<T>
```

## Parameters

None.

## Returns

`Blob<T>` - A proxy object that acts as type `T`.

## Description

`createBlob<T>()` creates a blob - a proxy object that serves as both:
- A unique identifier for the dependency
- The interface/type that consumers interact with

Each blob has a unique identity. Two blobs are never equal, even if they have the same type.

## Examples

### Basic Usage

```typescript
import { createBlob } from '@speajus/diblob';

interface Logger {
  log(message: string): void;
}

const logger = createBlob<Logger>();
```

### Multiple Blobs of Same Type

```typescript
const consoleLogger = createBlob<Logger>();
const fileLogger = createBlob<Logger>();

console.log(consoleLogger === fileLogger); // false - different blobs
```

### Using the Blob

```typescript
const logger = createBlob<Logger>();

// Register it
container.register(logger, ConsoleLogger);

// Use it directly
logger.log('Hello, world!');
```

## Related Functions

### isBlob

Check if a value is a blob:

```typescript
function isBlob(value: any): boolean
```

**Example:**

```typescript
import { isBlob } from '@speajus/diblob';

const logger = createBlob<Logger>();
const notABlob = new ConsoleLogger();

console.log(isBlob(logger));    // true
console.log(isBlob(notABlob));  // false
```

### getBlobId

Get a blob's internal ID:

```typescript
function getBlobId(blob: Blob<any>): number
```

**Example:**

```typescript
import { getBlobId } from '@speajus/diblob';

const logger = createBlob<Logger>();
const id = getBlobId(logger);

console.log(id); // number (e.g., 1)
```

**Note:** This is mainly useful for debugging and internal operations.

## Type Safety

Blobs are fully type-safe:

```typescript
const logger = createBlob<Logger>();

// TypeScript knows logger has log() method
logger.log('Hello'); // ✓ OK

// TypeScript catches errors
logger.notAMethod(); // ✗ Error: Property 'notAMethod' does not exist
```

## Best Practices

### 1. Create at Module Level

Create blobs at the module level for sharing:

```typescript
// services/logger.ts
export const logger = createBlob<Logger>();

// services/user-service.ts
import { logger } from './logger';
export const userService = createBlob<UserService>();
```

### 2. Use Descriptive Names

```typescript
// ✓ Good
const userService = createBlob<UserService>();
const emailSender = createBlob<EmailSender>();

// ✗ Avoid
const blob1 = createBlob<UserService>();
const x = createBlob<EmailSender>();
```

### 3. Export Blobs

Export blobs so they can be used across modules:

```typescript
// blobs.ts
export const logger = createBlob<Logger>();
export const database = createBlob<Database>();
export const cache = createBlob<Cache>();
```

## See Also

- [Blobs Guide](/guide/blobs) - Comprehensive guide to blobs
- [createContainer](/api/create-container) - Create a container
- [Container Methods](/api/container-methods) - Container operations

