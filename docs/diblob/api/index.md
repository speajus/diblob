# API Reference

Complete API reference for diblob.

## Core Functions

- [`createBlob<T>()`](/diblob/api/create-blob) - Create a new blob
- [`createListBlob<T>()`](/diblob/api/create-list-blob) - Create a list blob for arrays
- [`createContainer(...parents)`](/diblob/api/create-container) - Create a DI container

## Container Methods

- [`container.register()`](/diblob/api/container-methods#register) - Register a blob
- [`container.resolve()`](/diblob/api/container-methods#resolve) - Resolve a blob or class
- [`container.has()`](/diblob/api/container-methods#has) - Check if blob is registered
- [`container.unregister()`](/diblob/api/container-methods#unregister) - Unregister a blob
- [`container.clear()`](/diblob/api/container-methods#clear) - Clear all registrations

## Utility Functions

- [`isBlob(value)`](/diblob/api/create-blob#isblob) - Check if value is a blob
- [`getBlobId(blob)`](/diblob/api/create-blob#getblobid) - Get blob's internal ID

## Types

- [`Blob<T>`](/diblob/api/types#blob) - Blob type
- [`Container`](/diblob/api/types#container) - Container interface
- [`Factory<T>`](/diblob/api/types#factory) - Factory function type
- [`RegistrationOptions`](/diblob/api/types#registrationoptions) - Registration options
- [`Lifecycle`](/diblob/api/types#lifecycle) - Lifecycle enum

## Quick Reference

```typescript
import {
  createBlob,
  createListBlob,
  createContainer,
  isBlob,
  getBlobId,
  Lifecycle,
  type Blob,
  type Container,
  type Factory,
  type RegistrationOptions
} from '@speajus/diblob';

// Create blobs
const logger = createBlob<Logger>();
const database = createBlob<Database>();
const todos = createListBlob<string>();

// Create container
const container = createContainer();

// Register blobs
container.register(logger, ConsoleLogger);
container.register(database, DatabaseImpl, logger);
container.register(todos, () => []);

// Use blobs
logger.log('Hello');
database.query('SELECT * FROM users');
todos.push('Buy groceries');

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
interface RegistrationOptions<T> {
  lifecycle?: Lifecycle;
  dispose?: (() => void | Promise<void>) | ((instance: T) => void | Promise<void>) | keyof T;
  initialize?: (() => void | Promise<void>) | ((instance: T) => void | Promise<void>) | keyof T;
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

- [createBlob](/diblob/api/create-blob) - Learn about creating blobs
- [createListBlob](/diblob/api/create-list-blob) - Learn about creating list blobs
- [createContainer](/diblob/api/create-container) - Learn about creating containers
- [Container Methods](/diblob/api/container-methods) - Learn about container operations
- [Types](/diblob/api/types) - Learn about TypeScript types

# API Reference

Complete API reference for diblob.

## Core Functions

- [`createBlob<T>()`](/diblob/api/create-blob) - Create a new blob
- [`createContainer(...parents)`](/diblob/api/create-container) - Create a DI container

## Container Methods

- [`container.register()`](/diblob/api/container-methods#register) - Register a blob
- [`container.resolve()`](/diblob/api/container-methods#resolve) - Resolve a blob or class
- [`container.has()`](/diblob/api/container-methods#has) - Check if blob is registered
- [`container.unregister()`](/diblob/api/container-methods#unregister) - Unregister a blob
- [`container.clear()`](/diblob/api/container-methods#clear) - Clear all registrations

## Utility Functions

- [`isBlob(value)`](/diblob/api/create-blob#isblob) - Check if value is a blob
- [`getBlobId(blob)`](/diblob/api/create-blob#getblobid) - Get blob's internal ID

## Types

- [`Blob<T>`](/diblob/api/types#blob) - Blob type
- [`Container`](/diblob/api/types#container) - Container interface
- [`Factory<T>`](/diblob/api/types#factory) - Factory function type
- [`RegistrationOptions`](/diblob/api/types#registrationoptions) - Registration options
- [`Lifecycle`](/diblob/api/types#lifecycle) - Lifecycle enum

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
} from '@speajus/diblob';

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
interface RegistrationOptions<T> {
  lifecycle?: Lifecycle;
  dispose?: (() => void | Promise<void>) | ((instance: T) => void | Promise<void>) | keyof T;
  initialize?: (() => void | Promise<void>) | ((instance: T) => void | Promise<void>) | keyof T;
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

- [createBlob](/diblob/api/create-blob) - Learn about creating blobs
- [createContainer](/diblob/api/create-container) - Learn about creating containers
- [Container Methods](/diblob/api/container-methods) - Learn about container operations
- [Types](/diblob/api/types) - Learn about TypeScript types

