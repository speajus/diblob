# File Organization

This guide explains the recommended file organization pattern for diblob applications, promoting separation of concerns and maintainability.

## The Pattern

A well-organized diblob application separates code into three distinct layers:

1. **Interface/Blob Definition Files** - Define contracts and create blobs
2. **Implementation Files** - Concrete class implementations
3. **Registration Files** - Container setup and blob registration

This separation provides several benefits:
- **Clear separation of concerns** - Each file has a single responsibility
- **Better testability** - Easy to mock implementations
- **Improved maintainability** - Changes to implementations don't affect interfaces
- **Reusability** - Interfaces and blobs can be shared across modules

## Layer 1: Interface/Blob Definitions

Create files that contain **only** interface definitions and blob creation. No implementations or registration logic.

**File: `services/logger.ts`**
```typescript
import { createBlob } from '@speajus/diblob';

export interface Logger {
  log(message: string): void;
  error(message: string): void;
}

export const logger = createBlob<Logger>();
```

**File: `services/database.ts`**
```typescript
import { createBlob } from '@speajus/diblob';

export interface Database {
  query(sql: string): Promise<any[]>;
  execute(sql: string): Promise<void>;
}

export const database = createBlob<Database>();
```

**File: `services/user-service.ts`**
```typescript
import { createBlob } from '@speajus/diblob';
import type { User } from '../models/user';

export interface UserService {
  getUser(id: number): Promise<User>;
  createUser(name: string, email: string): Promise<User>;
}

export const userService = createBlob<UserService>();
```

## Layer 2: Implementations

Create separate files for concrete implementations. These files import the interfaces but not the blobs.

**File: `implementations/console-logger.ts`**
```typescript
import type { Logger } from '../services/logger';

export class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
}
```

**File: `implementations/postgres-database.ts`**
```typescript
import type { Database } from '../services/database';

export class PostgresDatabase implements Database {
  constructor(private connectionString: string) {}

  async query(sql: string): Promise<any[]> {
    // Implementation details
    return [];
  }

  async execute(sql: string): Promise<void> {
    // Implementation details
  }
}
```

**File: `implementations/user-service-impl.ts`**
```typescript
import type { UserService } from '../services/user-service';
import type { Logger } from '../services/logger';
import type { Database } from '../services/database';
import type { User } from '../models/user';

export class UserServiceImpl implements UserService {
  constructor(
    private logger: Logger,
    private database: Database
  ) {}

  async getUser(id: number): Promise<User> {
    this.logger.log(`Fetching user ${id}`);
    const results = await this.database.query(
      `SELECT * FROM users WHERE id = ${id}`
    );
    return results[0];
  }

  async createUser(name: string, email: string): Promise<User> {
    this.logger.log(`Creating user ${name}`);
    await this.database.execute(
      `INSERT INTO users (name, email) VALUES ('${name}', '${email}')`
    );
    return { id: Date.now(), name, email };
  }
}
```

## Layer 3: Registration

Create registration files that wire everything together. Use registration functions for related groups of blobs.

**File: `container/register-core.ts`**
```typescript
import type { Container } from '@speajus/diblob';
import { logger } from '../services/logger';
import { database } from '../services/database';
import { ConsoleLogger } from '../implementations/console-logger';
import { PostgresDatabase } from '../implementations/postgres-database';

export function registerCoreServices(container: Container): void {
  // Register logger with no dependencies
  container.register(logger, ConsoleLogger);

  // Register database with configuration
  const dbConnectionString = process.env.DATABASE_URL || 'postgresql://localhost/mydb';
  container.register(database, PostgresDatabase, dbConnectionString);
}
```

**File: `container/register-services.ts`**
```typescript
import type { Container } from '@speajus/diblob';
import { userService } from '../services/user-service';
import { logger } from '../services/logger';
import { database } from '../services/database';
import { UserServiceImpl } from '../implementations/user-service-impl';

export function registerBusinessServices(container: Container): void {
  // Register user service with blob dependencies
  container.register(userService, UserServiceImpl, logger, database);
}
```

**File: `container/index.ts`**
```typescript
import { createContainer } from '@speajus/diblob';
import { registerCoreServices } from './register-core';
import { registerBusinessServices } from './register-services';

// Create and configure the application container
export const appContainer = createContainer();

// Register all services
registerCoreServices(appContainer);
registerBusinessServices(appContainer);
```

## Application Entry Point

**File: `main.ts`**
```typescript
import { appContainer } from './container';
import { userService } from './services/user-service';

async function main() {
  // The container is already configured
  // Just use the blobs directly!

  const user = await userService.getUser(1);
  console.log('User:', user);

  const newUser = await userService.createUser('Alice', 'alice@example.com');
  console.log('Created:', newUser);
}

main().catch(console.error);
```

## Complete File Structure

Here's how the complete project structure looks:

```
src/
├── models/
│   └── user.ts                    # Data models/types
│
├── services/                      # Layer 1: Interfaces & Blobs
│   ├── logger.ts                  # Logger interface + blob
│   ├── database.ts                # Database interface + blob
│   └── user-service.ts            # UserService interface + blob
│
├── implementations/               # Layer 2: Concrete Implementations
│   ├── console-logger.ts          # ConsoleLogger class
│   ├── postgres-database.ts       # PostgresDatabase class
│   └── user-service-impl.ts       # UserServiceImpl class
│
├── container/                     # Layer 3: Registration
│   ├── register-core.ts           # Core services registration
│   ├── register-services.ts       # Business services registration
│   └── index.ts                   # Container creation & setup
│
└── main.ts                        # Application entry point
```

## Benefits of This Pattern

### 1. Clear Separation of Concerns

Each file has a single, well-defined purpose:
- Service files define **what** (interfaces and blobs)
- Implementation files define **how** (concrete classes)
- Registration files define **when and where** (container setup)

### 2. Easy Testing

You can easily create test-specific registrations:

```typescript
// test/setup.ts
import { createContainer } from '@speajus/diblob';
import { logger, database } from '../src/services';
import { MockLogger } from './mocks/mock-logger';
import { MockDatabase } from './mocks/mock-database';

export function createTestContainer() {
  const container = createContainer();

  // Register mocks instead of real implementations
  container.register(logger, MockLogger);
  container.register(database, MockDatabase);

  return container;
}
```

### 3. Environment-Specific Configuration

Different registration functions for different environments:

```typescript
// container/register-production.ts
export function registerProductionServices(container: Container): void {
  container.register(database, PostgresDatabase, process.env.DATABASE_URL);
  container.register(logger, CloudLogger, process.env.LOG_LEVEL);
}

// container/register-development.ts
export function registerDevelopmentServices(container: Container): void {
  container.register(database, PostgresDatabase, 'postgresql://localhost/dev');
  container.register(logger, ConsoleLogger);
}
```

### 4. Modular Registration

Register only what you need:

```typescript
// For a web API
import { registerCoreServices } from './container/register-core';
import { registerApiServices } from './container/register-api';

const apiContainer = createContainer();
registerCoreServices(apiContainer);
registerApiServices(apiContainer);

// For a background worker
import { registerCoreServices } from './container/register-core';
import { registerWorkerServices } from './container/register-worker';

const workerContainer = createContainer();
registerCoreServices(workerContainer);
registerWorkerServices(workerContainer);
```

## Anti-Patterns to Avoid

### ❌ Don't Mix Layers

**Bad:**
```typescript
// services/logger.ts - DON'T DO THIS
import { createBlob } from '@speajus/diblob';

export interface Logger {
  log(message: string): void;
}

export const logger = createBlob<Logger>();

// ❌ Implementation in the same file as interface
export class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(message);
  }
}

// ❌ Registration in the same file
import { createContainer } from '@speajus/diblob';
const container = createContainer();
container.register(logger, ConsoleLogger);
```

**Good:**
```typescript
// services/logger.ts - Interface and blob only
export interface Logger {
  log(message: string): void;
}
export const logger = createBlob<Logger>();

// implementations/console-logger.ts - Implementation only
export class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(message);
  }
}

// container/register-core.ts - Registration only
export function registerCoreServices(container: Container): void {
  container.register(logger, ConsoleLogger);
}
```

### ❌ Don't Create Blobs in Implementation Files

**Bad:**
```typescript
// implementations/user-service-impl.ts - DON'T DO THIS
import { createBlob } from '@speajus/diblob';

// ❌ Creating blob in implementation file
const logger = createBlob<Logger>();

export class UserServiceImpl {
  constructor(private logger = logger) {}
}
```

**Good:**
```typescript
// services/logger.ts - Blob created here
export const logger = createBlob<Logger>();

// implementations/user-service-impl.ts - Just use the type
import type { Logger } from '../services/logger';

export class UserServiceImpl {
  constructor(private logger: Logger) {}
}
```

## Next Steps

- [Getting Started](/guide/getting-started) - Basic diblob usage
- [Containers](/guide/containers) - Container features and methods
- [File Organization Example](/examples/file-organization) - Complete working example
- [Constructor Injection](/guide/constructor-injection) - Using blobs as default parameters


