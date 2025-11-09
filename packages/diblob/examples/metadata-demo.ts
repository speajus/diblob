/**
 * Metadata Demo
 * 
 * Demonstrates how to use metadata with blobs and containers
 * for better debugging and visualization.
 */

import { createBlob, createContainer, getBlobMetadata, getContainerMetadata } from '../src';

// Define interfaces
interface Logger {
  log(message: string): void;
}

interface Database {
  query(sql: string): unknown[];
}

interface UserService {
  getUser(id: number): { id: number; name: string };
  createUser(name: string): { id: number; name: string };
}

// Create blobs with metadata
const logger = createBlob<Logger>('logger', {
  name: 'Console Logger',
  description: 'Logs messages to the console',
  category: 'infrastructure',
  version: '1.0.0'
});

const database = createBlob<Database>('database', {
  name: 'In-Memory Database',
  description: 'Simple in-memory database for testing',
  category: 'infrastructure',
  version: '1.0.0'
});

const userService = createBlob<UserService>('userService', {
  name: 'User Service',
  description: 'Manages user data and operations',
  category: 'business',
  version: '2.1.0',
  author: 'Development Team'
});

// Implementations
class ConsoleLogger implements Logger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

class InMemoryDatabase implements Database {
  private data: Map<string, unknown[]> = new Map();

  query(sql: string): unknown[] {
    console.log(`[DB] Executing: ${sql}`);
    return this.data.get(sql) || [];
  }
}

class UserServiceImpl implements UserService {
  private users: Map<number, { id: number; name: string }> = new Map();
  private nextId = 1;

  constructor(
    private logger: Logger,
    private database: Database
  ) {}

  getUser(id: number) {
    this.logger.log(`Getting user ${id}`);
    this.database.query(`SELECT * FROM users WHERE id = ${id}`);
    return this.users.get(id) || { id: 0, name: 'Unknown' };
  }

  createUser(name: string) {
    const user = { id: this.nextId++, name };
    this.users.set(user.id, user);
    this.logger.log(`Created user: ${name}`);
    this.database.query(`INSERT INTO users VALUES (${user.id}, '${name}')`);
    return user;
  }
}

// Create container with metadata
const container = createContainer({
  name: 'Application Container',
  description: 'Main DI container for the application',
  environment: 'development',
  created: new Date().toISOString()
});

// Register services
container.register(logger, ConsoleLogger);
container.register(database, InMemoryDatabase);
container.register(userService, UserServiceImpl, logger, database);

// Display metadata
console.log('=== Metadata Demo ===\n');

console.log('Container Metadata:');
const containerMeta = getContainerMetadata(container);
console.log(JSON.stringify(containerMeta, null, 2));
console.log();

console.log('Logger Blob Metadata:');
const loggerMeta = getBlobMetadata(logger);
console.log(JSON.stringify(loggerMeta, null, 2));
console.log();

console.log('Database Blob Metadata:');
const dbMeta = getBlobMetadata(database);
console.log(JSON.stringify(dbMeta, null, 2));
console.log();

console.log('User Service Blob Metadata:');
const userServiceMeta = getBlobMetadata(userService);
console.log(JSON.stringify(userServiceMeta, null, 2));
console.log();

// Use the services
console.log('=== Using Services ===\n');
const user1 = userService.createUser('Alice');
console.log(`Created: ${user1.name} (ID: ${user1.id})`);

const user2 = userService.createUser('Bob');
console.log(`Created: ${user2.name} (ID: ${user2.id})`);

const retrieved = userService.getUser(1);
console.log(`Retrieved: ${retrieved.name} (ID: ${retrieved.id})`);

console.log('\n=== Demo Complete ===');
console.log('Metadata is now available for the diblob-visualizer to display!');

