/**
 * File Organization Demo
 * 
 * This example demonstrates the recommended file organization pattern for diblob.
 * In a real application, these would be in separate files as shown in the comments.
 */

import { createBlob, createContainer, type Container } from '../src';

// ============================================================================
// Layer 1: Interface/Blob Definitions (services/*.ts)
// ============================================================================

// File: services/logger.ts
export interface Logger {
  log(message: string): void;
  error(message: string): void;
}
export const logger = createBlob<Logger>();

// File: services/database.ts
export interface Database {
  query<T>(sql: string): Promise<T[]>;
  execute(sql: string): Promise<void>;
}
export const database = createBlob<Database>();

// File: services/email-service.ts
export interface EmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}
export const emailService = createBlob<EmailService>();

// File: services/user-service.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UserService {
  getUser(id: number): Promise<User>;
  createUser(name: string, email: string): Promise<User>;
}
export const userService = createBlob<UserService>();

// ============================================================================
// Layer 2: Implementations (implementations/*.ts)
// ============================================================================

// File: implementations/console-logger.ts
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${new Date().toISOString()} - ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
  }
}

// File: implementations/mock-database.ts
class MockDatabase implements Database {
  private users: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ];

  async query<T>(sql: string): Promise<T[]> {
    console.log(`[DB] Query: ${sql}`);
    await new Promise(resolve => setTimeout(resolve, 10));
    return this.users as T[];
  }

  async execute(sql: string): Promise<void> {
    console.log(`[DB] Execute: ${sql}`);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

// File: implementations/mock-email-service.ts
class MockEmailService implements EmailService {
  constructor(private logger: Logger) {}

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`Sending email to ${to}: ${subject}`);
    await new Promise(resolve => setTimeout(resolve, 50));
    this.logger.log(`Email sent to ${to}`);
  }
}

// File: implementations/user-service-impl.ts
class UserServiceImpl implements UserService {
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
    
    await this.emailService.sendEmail(
      email,
      'Welcome!',
      `Hello ${name}, welcome to our service!`
    );
    
    this.logger.log(`User created: ${user.id}`);
    return user;
  }
}

// ============================================================================
// Layer 3: Registration (container/*.ts)
// ============================================================================

// File: container/register-core.ts
function registerCoreServices(container: Container): void {
  container.register(logger, ConsoleLogger);
  container.register(database, MockDatabase);
}

// File: container/register-services.ts
function registerBusinessServices(container: Container): void {
  container.register(emailService, MockEmailService, logger);
  container.register(userService, UserServiceImpl, logger, database, emailService);
}

// File: container/index.ts
function createAppContainer(): Container {
  const container = createContainer();
  registerCoreServices(container);
  registerBusinessServices(container);
  return container;
}

// ============================================================================
// Application Entry Point (main.ts)
// ============================================================================

async function main() {
  console.log('=== File Organization Demo ===\n');

  // Create and configure the container
  createAppContainer();

  console.log('Container configured with all services\n');

  // Now use the blobs directly - they're already wired up!

  try {
    // Fetch an existing user
    console.log('1. Fetching existing user:');
    const existingUser = await userService.getUser(1);
    console.log(`   Found: ${existingUser.name} (${existingUser.email})\n`);

    // Create a new user
    console.log('2. Creating new user:');
    const newUser = await userService.createUser('Charlie', 'charlie@example.com');
    console.log(`   Created: ${newUser.name} (${newUser.email})\n`);

    console.log('=== Demo Complete ===\n');

    console.log('File Structure:');
    console.log('src/');
    console.log('├── services/              # Layer 1: Interfaces & Blobs');
    console.log('│   ├── logger.ts');
    console.log('│   ├── database.ts');
    console.log('│   ├── email-service.ts');
    console.log('│   └── user-service.ts');
    console.log('│');
    console.log('├── implementations/       # Layer 2: Implementations');
    console.log('│   ├── console-logger.ts');
    console.log('│   ├── mock-database.ts');
    console.log('│   ├── mock-email-service.ts');
    console.log('│   └── user-service-impl.ts');
    console.log('│');
    console.log('├── container/             # Layer 3: Registration');
    console.log('│   ├── register-core.ts');
    console.log('│   ├── register-services.ts');
    console.log('│   └── index.ts');
    console.log('│');
    console.log('└── main.ts                # Entry point');

  } catch (error) {
    logger.error(`Error: ${error}`);
    process.exit(1);
  }
}

// Run the demo
main().catch(console.error);

