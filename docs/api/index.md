# API Reference

Complete API reference for diblob.

## Core Functions

- [`createBlob<T>()`](/api/create-blob) - Create a new blob
- [`createContainer(...parents)`](/api/create-container) - Create a DI container

## Container Methods

- [`container.register()`](/api/container-methods#register) - Register a blob
- [`container.resolve()`](/api/container-methods#resolve) - Resolve a blob or class
- [`container.has()`](/api/container-methods#has) - Check if blob is registered
- [`container.unregister()`](/api/container-methods#unregister) - Unregister a blob
- [`container.clear()`](/api/container-methods#clear) - Clear all registrations

## Utility Functions

- [`isBlob(value)`](/api/create-blob#isblob) - Check if value is a blob
- [`getBlobId(blob)`](/api/create-blob#getblobid) - Get blob's internal ID

## Types

- [`Blob<T>`](/api/types#blob) - Blob type
- [`Container`](/api/types#container) - Container interface
- [`Factory<T>`](/api/types#factory) - Factory function type
- [`RegistrationOptions`](/api/types#registrationoptions) - Registration options
- [`Lifecycle`](/api/types#lifecycle) - Lifecycle enum

## Quick Reference

```typescript
import { 
  createBlob, 
  createContainer,
  isBlob,
  getBlobId,
  Lifecycle,
  type Blob,
  type Container,
  type Factory,
  type RegistrationOptions
} from 'diblob';

// Create blobs
const logger = createBlob<Logger>();
const database = createBlob<Database>();

// Create container
const container = createContainer();

// Register blobs
container.register(logger, ConsoleLogger);
container.register(database, DatabaseImpl, logger);

// Use blobs
logger.log('Hello');
database.query('SELECT * FROM users');

// Resolve manually
const loggerInstance = await container.resolve(logger);

// Check registration
if (container.has(logger)) {
  console.log('Logger is registered');
}

// Unregister
container.unregister(logger);

// Clear all
container.clear();

// Utility functions
console.log(isBlob(logger));      // true
console.log(getBlobId(logger));   // number
```

## Type Definitions

```typescript
// Blob type
type Blob<T> = T;

// Factory type
type Factory<T> = (() => T) | (() => Promise<T>) | (new (...args: any[]) => T);

// Registration options
interface RegistrationOptions {
  lifecycle?: Lifecycle;
}

// Lifecycle enum
enum Lifecycle {
  Singleton = 'singleton',
  Transient = 'transient'
}

// Container interface
interface Container {
  register<T>(
    blob: Blob<T>,
    factory: Factory<T>,
    ...deps: any[]
  ): void;
  
  resolve<T>(blobOrConstructor: Blob<T> | (new (...args: any[]) => T)): Promise<T>;
  
  has<T>(blob: Blob<T>): boolean;
  
  unregister<T>(blob: Blob<T>): void;
  
  clear(): void;
}
```

## Next Steps

- [createBlob](/api/create-blob) - Learn about creating blobs
- [createContainer](/api/create-container) - Learn about creating containers
- [Container Methods](/api/container-methods) - Learn about container operations
- [Types](/api/types) - Learn about TypeScript types

