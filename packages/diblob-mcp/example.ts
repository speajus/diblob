/**
 * Example usage of diblob-mcp
 * 
 * This example demonstrates how to set up an MCP server for a diblob container.
 */

import { createBlob, createContainer } from '@speajus/diblob';
import { mcpServer, registerMcpBlobs } from './src/index.js';

// Define some example services
interface Logger {
  log(message: string): void;
}

interface Database {
  query(sql: string): Promise<unknown[]>;
}

interface UserService {
  getUser(id: number): Promise<{ id: number; name: string }>;
}

// Create blobs
const logger = createBlob<Logger>('logger', {
  name: 'Logger',
  description: 'Application logger service'
});

const database = createBlob<Database>('database', {
  name: 'Database',
  description: 'Database connection service'
});

const userService = createBlob<UserService>('userService', {
  name: 'User Service',
  description: 'Service for managing users'
});

// Create implementations
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

class MockDatabase implements Database {
  constructor(private log: Logger) {}
  
  async query(sql: string): Promise<unknown[]> {
    this.log.log(`Executing query: ${sql}`);
    return [];
  }
}

class UserServiceImpl implements UserService {
  constructor(
    private log: Logger,
    private db: Database
  ) {}
  
  async getUser(id: number): Promise<{ id: number; name: string }> {
    this.log.log(`Fetching user ${id}`);
    await this.db.query(`SELECT * FROM users WHERE id = ${id}`);
    return { id, name: 'John Doe' };
  }
}

// Create container and register services
const container = createContainer();

container.register(logger, ConsoleLogger);
container.register(database, MockDatabase, logger);
container.register(userService, UserServiceImpl, logger, database);

// Register MCP server blobs
registerMcpBlobs(container, {
	  name: 'example-diblob-mcp-server',
	  version: '1.0.0',
	  description: 'Example MCP server for diblob container'
	});

// Start the MCP server by resolving the blob (lifecycle will call start() for you)
console.log('Starting MCP server...');
await container.resolve(mcpServer);
console.log('MCP server started successfully!');
console.log('The server is now listening for MCP requests via stdio.');
console.log('You can use MCP tools to introspect the container:');
console.log('  - list_blobs: List all registered blobs');
console.log('  - get_blob_details: Get details about a specific blob');
console.log('  - get_dependency_graph: Get the dependency graph');

