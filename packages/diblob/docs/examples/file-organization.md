# File Organization Example

A complete example demonstrating the recommended file organization pattern for diblob applications.

## Overview

This example shows how to structure a diblob application with proper separation of concerns across multiple files:

- **Layer 1**: Interface and blob definitions
- **Layer 2**: Concrete implementations
- **Layer 3**: Registration functions and container setup

## Layer 1: Interfaces & Blobs

### `services/logger.ts`

```typescript
import { createBlob } from '@speajus/diblob';

export interface Logger {
  log(message: string): void;
  error(message: string): void;
  warn(message: string): void;
}

export const logger = createBlob<Logger>();
```

### `services/database.ts`

```typescript
import { createBlob } from '@speajus/diblob';

export interface Database {
  query<T>(sql: string): Promise<T[]>;
  execute(sql: string): Promise<void>;
}

export const database = createBlob<Database>();
```

### `services/email-service.ts`

```typescript
import { createBlob } from '@speajus/diblob';

export interface EmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

export const emailService = createBlob<EmailService>();
```

### `services/user-service.ts`

```typescript
import { createBlob } from '@speajus/diblob';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UserService {
  getUser(id: number): Promise<User>;
  createUser(name: string, email: string): Promise<User>;
  deleteUser(id: number): Promise<void>;
}

export const userService = createBlob<UserService>();
```

## Layer 2: Implementations

### `implementations/console-logger.ts`

```typescript
import type { Logger } from '../services/logger';

export class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${new Date().toISOString()} - ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
  }

  warn(message: string): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
  }
}
```

### `implementations/postgres-database.ts`

```typescript
import type { Database } from '../services/database';

export class PostgresDatabase implements Database {
  constructor(private connectionString: string) {
    console.log(`Connecting to database: ${connectionString}`);
  }

  async query<T>(sql: string): Promise<T[]> {
    console.log(`Executing query: ${sql}`);
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 10));
    return [] as T[];
  }

  async execute(sql: string): Promise<void> {
    console.log(`Executing command: ${sql}`);
    // Simulate database execution
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
```

### `implementations/smtp-email-service.ts`

```typescript
import type { EmailService } from '../services/email-service';
import type { Logger } from '../services/logger';

export class SmtpEmailService implements EmailService {
  constructor(
    private logger: Logger,
    private smtpHost: string,
    private smtpPort: number
  ) {
    this.logger.log(`Email service configured: ${smtpHost}:${smtpPort}`);
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`Sending email to ${to}: ${subject}`);
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 100));
    this.logger.log(`Email sent successfully to ${to}`);
  }
}
```

### `implementations/user-service-impl.ts`

```typescript
import type { UserService, User } from '../services/user-service';
import type { Logger } from '../services/logger';
import type { Database } from '../services/database';
import type { EmailService } from '../services/email-service';

export class UserServiceImpl implements UserService {
  constructor(
    private logger: Logger,
    private database: Database,
    private emailService: EmailService
  ) {
    this.logger.log('UserService initialized');
  }

  async getUser(id: number): Promise<User> {
    this.logger.log(`Fetching user ${id}`);
    const users = await this.database.query<User>(
      `SELECT * FROM users WHERE id = ${id}`
    );
    
    if (users.length === 0) {
      this.logger.error(`User ${id} not found`);
      throw new Error(`User ${id} not found`);
    }
    
    return users[0];
  }

  async createUser(name: string, email: string): Promise<User> {
    this.logger.log(`Creating user: ${name} (${email})`);
    
    await this.database.execute(
      `INSERT INTO users (name, email) VALUES ('${name}', '${email}')`
    );
    
    const user: User = {
      id: Date.now(),
      name,
      email
    };
    
    // Send welcome email
    await this.emailService.sendEmail(
      email,
      'Welcome!',
      `Hello ${name}, welcome to our service!`
    );
    
    this.logger.log(`User created: ${user.id}`);
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    this.logger.log(`Deleting user ${id}`);
    await this.database.execute(`DELETE FROM users WHERE id = ${id}`);
    this.logger.log(`User ${id} deleted`);
  }
}
```

## Layer 3: Registration

### `container/register-core.ts`

```typescript
import type { Container } from '@speajus/diblob';
import { logger } from '../services/logger';
import { database } from '../services/database';
import { ConsoleLogger } from '../implementations/console-logger';
import { PostgresDatabase } from '../implementations/postgres-database';

/**
 * Register core infrastructure services
 */
export function registerCoreServices(container: Container): void {
  // Logger has no dependencies
  container.register(logger, ConsoleLogger);

  // Database needs connection string
  const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/mydb';
  container.register(database, PostgresDatabase, dbUrl);
}
```

### `container/register-services.ts`

```typescript
import type { Container } from '@speajus/diblob';
import { emailService } from '../services/email-service';
import { userService } from '../services/user-service';
import { logger } from '../services/logger';
import { database } from '../services/database';
import { SmtpEmailService } from '../implementations/smtp-email-service';
import { UserServiceImpl } from '../implementations/user-service-impl';

/**
 * Register business services
 */
export function registerBusinessServices(container: Container): void {
  // Email service depends on logger and configuration
  const smtpHost = process.env.SMTP_HOST || 'localhost';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

  container.register(
    emailService,
    SmtpEmailService,
    logger,
    smtpHost,
    smtpPort
  );

  // User service depends on logger, database, and email service
  container.register(
    userService,
    UserServiceImpl,
    logger,
    database,
    emailService
  );
}
```

### `container/index.ts`

```typescript
import { createContainer } from '@speajus/diblob';
import { registerCoreServices } from './register-core';
import { registerBusinessServices } from './register-services';

/**
 * Create and configure the application container
 */
export function createAppContainer() {
  const container = createContainer();

  // Register services in order
  registerCoreServices(container);
  registerBusinessServices(container);

  return container;
}

// Export a singleton container for the application
export const appContainer = createAppContainer();
```

## Application Entry Point

### `main.ts`

```typescript
import './container'; // Initialize container
import { userService } from './services/user-service';
import { logger } from './services/logger';

async function main() {
  logger.log('Application starting...');

  try {
    // Create a new user
    const newUser = await userService.createUser(
      'Alice Johnson',
      'alice@example.com'
    );
    logger.log(`Created user: ${JSON.stringify(newUser)}`);

    // Fetch the user
    const fetchedUser = await userService.getUser(newUser.id);
    logger.log(`Fetched user: ${JSON.stringify(fetchedUser)}`);

    // Delete the user
    await userService.deleteUser(newUser.id);
    logger.log('User deleted successfully');

  } catch (error) {
    logger.error(`Application error: ${error}`);
    process.exit(1);
  }

  logger.log('Application finished successfully');
}

main();
```

## Complete File Structure

```
src/
├── services/                      # Layer 1: Interfaces & Blobs
│   ├── logger.ts
│   ├── database.ts
│   ├── email-service.ts
│   └── user-service.ts
│
├── implementations/               # Layer 2: Implementations
│   ├── console-logger.ts
│   ├── postgres-database.ts
│   ├── smtp-email-service.ts
│   └── user-service-impl.ts
│
├── container/                     # Layer 3: Registration
│   ├── register-core.ts
│   ├── register-services.ts
│   └── index.ts
│
└── main.ts                        # Entry point
```

## Running the Example

```bash
# Set environment variables (optional)
export DATABASE_URL="postgresql://localhost:5432/mydb"
export SMTP_HOST="smtp.example.com"
export SMTP_PORT="587"

# Run the application
node main.ts
```

## Expected Output

```
Connecting to database: postgresql://localhost:5432/mydb
[LOG] 2024-01-15T10:30:00.000Z - Email service configured: smtp.example.com:587
[LOG] 2024-01-15T10:30:00.000Z - UserService initialized
[LOG] 2024-01-15T10:30:00.000Z - Application starting...
[LOG] 2024-01-15T10:30:00.000Z - Creating user: Alice Johnson (alice@example.com)
Executing command: INSERT INTO users (name, email) VALUES ('Alice Johnson', 'alice@example.com')
[LOG] 2024-01-15T10:30:00.010Z - Sending email to alice@example.com: Welcome!
[LOG] 2024-01-15T10:30:00.110Z - Email sent successfully to alice@example.com
[LOG] 2024-01-15T10:30:00.110Z - User created: 1705318200000
[LOG] 2024-01-15T10:30:00.110Z - Created user: {"id":1705318200000,"name":"Alice Johnson","email":"alice@example.com"}
[LOG] 2024-01-15T10:30:00.110Z - Fetching user 1705318200000
Executing query: SELECT * FROM users WHERE id = 1705318200000
[LOG] 2024-01-15T10:30:00.120Z - Fetched user: {"id":1705318200000,"name":"Alice Johnson","email":"alice@example.com"}
[LOG] 2024-01-15T10:30:00.120Z - Deleting user 1705318200000
Executing command: DELETE FROM users WHERE id = 1705318200000
[LOG] 2024-01-15T10:30:00.130Z - User 1705318200000 deleted
[LOG] 2024-01-15T10:30:00.130Z - User deleted successfully
[LOG] 2024-01-15T10:30:00.130Z - Application finished successfully
```

## Testing with Different Implementations

One of the key benefits of this pattern is easy testing. Here's how to create a test setup:

### `test/mocks/mock-logger.ts`

```typescript
import type { Logger } from '../../src/services/logger';

export class MockLogger implements Logger {
  public logs: string[] = [];
  public errors: string[] = [];
  public warnings: string[] = [];

  log(message: string): void {
    this.logs.push(message);
  }

  error(message: string): void {
    this.errors.push(message);
  }

  warn(message: string): void {
    this.warnings.push(message);
  }

  clear(): void {
    this.logs = [];
    this.errors = [];
    this.warnings = [];
  }
}
```

### `test/setup.ts`

```typescript
import { createContainer } from '@speajus/diblob';
import { logger } from '../src/services/logger';
import { database } from '../src/services/database';
import { emailService } from '../src/services/email-service';
import { MockLogger } from './mocks/mock-logger';
import { MockDatabase } from './mocks/mock-database';
import { MockEmailService } from './mocks/mock-email-service';
import { registerBusinessServices } from '../src/container/register-services';

export function createTestContainer() {
  const container = createContainer();

  // Register mocks for infrastructure
  container.register(logger, MockLogger);
  container.register(database, MockDatabase);
  container.register(emailService, MockEmailService);

  // Register real business services (they'll use the mocks)
  registerBusinessServices(container);

  return container;
}
```

## Key Takeaways

1. **Interfaces and blobs** live in `services/` - they define the contract
2. **Implementations** live in `implementations/` - they fulfill the contract
3. **Registration** happens in `container/` - it wires everything together
4. **Each layer** has a single responsibility and can evolve independently
5. **Testing** is easy because you can swap implementations without changing interfaces
6. **Configuration** is centralized in registration functions

## Next Steps

- [File Organization Guide](/guide/file-organization) - Detailed explanation of the pattern
- [Getting Started](/guide/getting-started) - Basic diblob usage
- [Containers](/guide/containers) - Container features and methods


