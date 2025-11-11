# Getting Started with diblob-mcp

This guide will help you set up and use the Model Context Protocol server for your diblob containers.

## Installation

First, install the required packages:

```bash
npm install @speajus/diblob-mcp @speajus/diblob @modelcontextprotocol/sdk
```

## Basic Setup

### Step 1: Create Your Container

Start by creating a diblob container and registering your services:

```typescript
import { createBlob, createContainer } from '@speajus/diblob';

// Define your services
interface Logger {
  log(message: string): void;
}

interface Database {
  query(sql: string): Promise<any>;
}

// Create blobs with metadata
const logger = createBlob<Logger>('logger', {
  name: 'Logger',
  description: 'Application logger service'
});

const database = createBlob<Database>('database', {
  name: 'Database',
  description: 'Database connection service'
});

// Create container and register services
const container = createContainer();

container.register(logger, ConsoleLogger);
container.register(database, DatabaseImpl, logger);
```

### Step 2: Register MCP Server

Add the MCP server to your container:

```typescript
import { registerMcpBlobs } from '@speajus/diblob-mcp';

// Register MCP server blobs
registerMcpBlobs(container);
```

### Step 3: Start the Server

Start the MCP server to begin accepting requests:

```typescript
import { mcpServer } from '@speajus/diblob-mcp';

// Start the MCP server
await mcpServer.start();

console.log('MCP server is running!');
```

## Complete Example

Here's a complete example:

```typescript
import { createBlob, createContainer } from '@speajus/diblob';
import { registerMcpBlobs, mcpServer } from '@speajus/diblob-mcp';

// Define services
interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

// Create blobs
const logger = createBlob<Logger>('logger', {
  name: 'Logger',
  description: 'Console logger'
});

// Create and configure container
const container = createContainer();
container.register(logger, ConsoleLogger);

// Register and start MCP server
registerMcpBlobs(container, {
  name: 'my-app-mcp-server',
  version: '1.0.0',
  description: 'MCP server for my application'
});

await mcpServer.start();
console.log('MCP server started successfully!');
```

## Using MCP Tools

Once the server is running, you can use MCP clients (like AI assistants) to interact with your container:

### List All Blobs

Use the `list_blobs` tool to see all registered services:

```json
// Request
{
  "tool": "list_blobs"
}

// Response
[
  {
    "id": "Symbol(logger)",
    "name": "Logger",
    "description": "Console logger",
    "lifecycle": "Singleton"
  }
]
```

### Get Blob Details

Use the `get_blob_details` tool to inspect a specific service:

```json
// Request
{
  "tool": "get_blob_details",
  "arguments": {
    "blobId": "Symbol(logger)"
  }
}

// Response
{
  "id": "Symbol(logger)",
  "name": "Logger",
  "description": "Console logger",
  "lifecycle": "Singleton",
  "dependencies": []
}
```

### Get Dependency Graph

Use the `get_dependency_graph` tool to visualize dependencies:

```json
// Request
{
  "tool": "get_dependency_graph"
}

// Response
{
  "nodes": [
    { "id": "Symbol(logger)", "name": "Logger" }
  ],
  "edges": []
}
```

## Next Steps

- See [integration examples](/mcp/examples)
- Read the [package README](https://github.com/speajus/diblob/tree/main/packages/diblob-mcp)

## Troubleshooting

### Server Won't Start

Make sure you've registered the MCP blobs before trying to start the server:

```typescript
// ✅ Correct order
registerMcpBlobs(container);
await mcpServer.start();

// ❌ Wrong - server not registered
await mcpServer.start(); // Error!
```

### Can't See My Blobs

Ensure your blobs are registered in the container before starting the MCP server. The introspector only sees blobs that are registered at the time of the query.

