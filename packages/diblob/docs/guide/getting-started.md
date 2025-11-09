# Getting Started

This guide will help you get started with diblob in just a few minutes.

## Installation

::: code-group
```bash [npm]
npm install @speajus/diblob
```

```bash [yarn]
yarn add @speajus/diblob
```

```bash [pnpm]
pnpm add @speajus/diblob
```
:::

## Requirements

- Node.js >= 22.0.0
- TypeScript >= 5.3.3 (for TypeScript projects)

## Your First diblob Application

Let's build a simple application with a logger and a user service.

### Step 1: Define Your Interfaces

```typescript
interface Logger {
  log(message: string): void;
}

interface Database {
  query(sql: string): any[];
}

interface UserService {
  getUser(id: number): User;
}

interface User {
  id: number;
  name: string;
}
```

### Step 2: Create Blobs

```typescript
import { createBlob } from '@speajus/diblob';

const logger = createBlob<Logger>();
const database = createBlob<Database>();
const userService = createBlob<UserService>();
```

### Step 3: Implement Your Classes

```typescript
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

class DatabaseImpl implements Database {
  constructor(private logger: Logger) {}
  
  query(sql: string): any[] {
    this.logger.log(`Executing: ${sql}`);
    // ... database logic
    return [];
  }
}

class UserServiceImpl implements UserService {
  constructor(
    private logger: Logger,
    private database: Database
  ) {}
  
  getUser(id: number): User {
    this.logger.log(`Fetching user ${id}`);
    const results = this.database.query(`SELECT * FROM users WHERE id = ${id}`);
    return results[0];
  }
}
```

### Step 4: Create a Container and Register

```typescript
import { createContainer } from '@speajus/diblob';

const container = createContainer();

// Register with no dependencies
container.register(logger, ConsoleLogger);

// Register with blob dependencies
container.register(database, DatabaseImpl, logger);
container.register(userService, UserServiceImpl, logger, database);
```

### Step 5: Use Your Blobs

```typescript
// Use the blob directly - it acts as the interface!
const user = userService.getUser(123);
console.log(user.name);
```

That's it! The blob automatically forwards all calls to the registered implementation.

## Complete Example

Here's the complete code:

```typescript
import { createBlob, createContainer } from '@speajus/diblob';

// Interfaces
interface Logger {
  log(message: string): void;
}

interface UserService {
  getUser(id: number): { id: number; name: string };
}

// Implementations
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

class UserServiceImpl implements UserService {
  constructor(private logger: Logger) {}
  
  getUser(id: number) {
    this.logger.log(`Fetching user ${id}`);
    return { id, name: 'John Doe' };
  }
}

// Create blobs
const logger = createBlob<Logger>();
const userService = createBlob<UserService>();

// Create container and register
const container = createContainer();
container.register(logger, ConsoleLogger);
container.register(userService, UserServiceImpl, logger);

// Use the blob
const user = userService.getUser(123);
console.log(user.name); // "John Doe"
```

## Organizing Your Code

The example above shows everything in a single file for simplicity. In a real application, you should organize your code into separate files for better maintainability:

- **Interface/Blob files** - Define interfaces and create blobs
- **Implementation files** - Concrete class implementations
- **Registration files** - Container setup and blob registration

For example:

```typescript
// services/logger.ts - Interface and blob only
export interface Logger {
  log(message: string): void;
}
export const logger = createBlob<Logger>();

// implementations/console-logger.ts - Implementation only
export class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

// container/register-core.ts - Registration only
export function registerCoreServices(container: Container): void {
  container.register(logger, ConsoleLogger);
}
```

This separation provides:
- **Clear separation of concerns** - Each file has a single responsibility
- **Better testability** - Easy to swap implementations for testing
- **Improved maintainability** - Changes to implementations don't affect interfaces

See the [File Organization Guide](/guide/file-organization) for detailed best practices and a complete example.

## Next Steps

Now that you understand the basics, explore these topics:

- [File Organization](/guide/file-organization) - **Recommended**: Learn how to structure your diblob application
- [Blobs](/guide/blobs) - Learn more about creating and using blobs
- [Containers](/guide/containers) - Understand container features
- [Dependency Resolution](/guide/dependency-resolution) - How dependencies are resolved
- [Reactive Dependencies](/guide/reactive-dependencies) - Automatic updates when implementations change

