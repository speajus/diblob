# MCP Examples

Practical examples of using diblob-mcp in different scenarios.

## Basic MCP Server

A simple MCP server for a basic application:

```typescript
import { createBlob, createContainer } from '@speajus/diblob';
import { registerMcpBlobs, mcpServer } from '@speajus/diblob-mcp';

// Define services
interface Logger {
  log(message: string): void;
}

const logger = createBlob<Logger>('logger', {
  name: 'Logger',
  description: 'Application logger'
});

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

// Setup
const container = createContainer();
container.register(logger, ConsoleLogger);
registerMcpBlobs(container);

// Start server
await mcpServer.start();
```

## Multi-Service Application

MCP server for an application with multiple services:

```typescript
import { createBlob, createContainer } from '@speajus/diblob';
import { registerMcpBlobs, mcpServer } from '@speajus/diblob-mcp';

// Define services
interface Logger {
  log(message: string): void;
}

interface Database {
  query(sql: string): Promise<any>;
}

interface UserService {
  getUser(id: number): Promise<User>;
}

// Create blobs with rich metadata
const logger = createBlob<Logger>('logger', {
  name: 'Logger',
  description: 'Application logger service',
  tags: ['infrastructure', 'logging']
});

const database = createBlob<Database>('database', {
  name: 'Database',
  description: 'PostgreSQL database connection',
  tags: ['infrastructure', 'data']
});

const userService = createBlob<UserService>('userService', {
  name: 'User Service',
  description: 'Service for managing user data',
  tags: ['business', 'users']
});

// Implementations
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

class PostgresDatabase implements Database {
  constructor(private logger: Logger) {}
  
  async query(sql: string): Promise<any> {
    this.logger.log(`Executing: ${sql}`);
    // ... database logic
    return [];
  }
}

class UserServiceImpl implements UserService {
  constructor(
    private logger: Logger,
    private db: Database
  ) {}
  
  async getUser(id: number): Promise<User> {
    this.logger.log(`Fetching user ${id}`);
    const result = await this.db.query(`SELECT * FROM users WHERE id = ${id}`);
    return result[0];
  }
}

// Setup container
const container = createContainer();
container.register(logger, ConsoleLogger);
container.register(database, PostgresDatabase, logger);
container.register(userService, UserServiceImpl, logger, database);

// Register MCP server with custom config
registerMcpBlobs(container, {
  name: 'user-management-mcp-server',
  version: '2.0.0',
  description: 'MCP server for user management system'
});

// Start server
await mcpServer.start();
console.log('User management MCP server is running');
```

## Microservice with MCP

Using MCP to expose a microservice's internal structure:

```typescript
import { createBlob, createContainer } from '@speajus/diblob';
import { registerMcpBlobs, mcpServer } from '@speajus/diblob-mcp';

// Service interfaces
interface Config {
  apiKey: string;
  endpoint: string;
}

interface HttpClient {
  get(url: string): Promise<any>;
  post(url: string, data: any): Promise<any>;
}

interface ApiService {
  fetchData(): Promise<any>;
}

// Create blobs
const config = createBlob<Config>('config');
const httpClient = createBlob<HttpClient>('httpClient');
const apiService = createBlob<ApiService>('apiService');

// Setup
const container = createContainer();

container.register(config, () => ({
  apiKey: process.env.API_KEY || '',
  endpoint: process.env.API_ENDPOINT || 'https://api.example.com'
}));

container.register(httpClient, HttpClientImpl, config);
container.register(apiService, ApiServiceImpl, httpClient);

// Register MCP for introspection
registerMcpBlobs(container, {
  name: 'microservice-mcp',
  version: '1.0.0'
});

await mcpServer.start();
```

## Testing with MCP

Using MCP to inspect test containers:

```typescript
import { createBlob, createContainer } from '@speajus/diblob';
import { registerMcpBlobs, mcpServer } from '@speajus/diblob-mcp';

// Create test container
const testContainer = createContainer();

// Register test doubles
testContainer.register(logger, MockLogger);
testContainer.register(database, InMemoryDatabase);

// Add MCP for test introspection
registerMcpBlobs(testContainer, {
  name: 'test-container-mcp',
  version: '1.0.0',
  description: 'MCP server for test container introspection'
});

// Now you can use MCP tools to verify your test setup
await mcpServer.start();
```

## Next Steps

- Read the [getting started guide](/mcp/getting-started)
- See the [package README](https://github.com/speajus/diblob/tree/main/packages/diblob-mcp)
- Explore the [main documentation](/mcp/)

