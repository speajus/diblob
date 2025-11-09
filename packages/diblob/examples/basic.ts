/**
 * Basic example demonstrating diblob usage
 */

import { createBlob, createContainer, Lifecycle } from '../src';

// Define interfaces
interface Logger {
  log(message: string): void;
}

interface Database {
  query(sql: string): any[];
}

interface UserService {
  getUser(id: number): { id: number; name: string };
  getAllUsers(): { id: number; name: string }[];
}

// Implementations
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

class MockDatabase implements Database {
  private data = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ];

  query(sql: string): any[] {
    console.log(`[DB] Executing: ${sql}`);
    return this.data;
  }
}

class UserServiceImpl implements UserService {
  constructor(
    private logger: Logger,
    private db: Database
  ) {}

  getUser(id: number) {
    this.logger.log(`Fetching user ${id}`);
    const users = this.db.query(`SELECT * FROM users WHERE id = ${id}`);
    return users[0];
  }

  getAllUsers() {
    this.logger.log('Fetching all users');
    return this.db.query('SELECT * FROM users');
  }
}

// Create blobs
const logger = createBlob<Logger>();
const database = createBlob<Database>();
const userService = createBlob<UserService>();

// Create container and register blobs
const container = createContainer();

// Register with constructors - dependencies are automatically resolved!
container.register(logger, ConsoleLogger);
container.register(database, MockDatabase);
container.register(userService, UserServiceImpl, logger, database);

// Now use the blobs directly - they act as their interfaces!
console.log('\n=== Example 1: Basic Usage ===');
const user = userService.getUser(1);
console.log('User:', user);

console.log('\n=== Example 2: Passing blobs around ===');
function printAllUsers(service: UserService) {
  const users = service.getAllUsers();
  console.log('All users:', users);
}
printAllUsers(userService); // Pass the blob directly!

console.log('\n=== Example 3: Reactive dependencies ===');
// Re-register the logger with a different implementation
class PrefixLogger implements Logger {
  log(message: string): void {
    console.log(`>>> ${message}`);
  }
}

container.register(logger, PrefixLogger);
// The userService will automatically use the new logger!
userService.getUser(2);

console.log('\n=== Example 4: Transient lifecycle ===');
const transientLogger = createBlob<Logger>();

// Use a factory function to log when instances are created
container.register(
  transientLogger,
  () => {
    console.log('[Creating new logger instance]');
    return new ConsoleLogger();
  },
  { lifecycle: Lifecycle.Transient }
);

// Each resolution creates a new instance
container.resolve(transientLogger);
container.resolve(transientLogger);
container.resolve(transientLogger);

console.log('\n=== Example 5: Mixed dependencies (blobs and values) ===');
interface Config {
  env: string;
  db: Database;
}

class ConfigImpl implements Config {
  constructor(public env: string, public db: Database) {}
}

const config = createBlob<Config>();
// Mix blob dependencies with plain values
container.register(config, ConfigImpl, 'production', database);
console.log('Config env:', config.env);
console.log('Config has database:', !!config.db);

console.log('\n=== Done! ===');

