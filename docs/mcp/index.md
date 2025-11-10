# diblob-mcp

Model Context Protocol (MCP) server implementation for diblob dependency injection containers.

## Overview

`@speajus/diblob-mcp` provides an MCP server that exposes diblob container functionality through the Model Context Protocol, enabling AI assistants and other MCP clients to introspect and interact with your dependency injection containers.

## Installation

```bash
npm install @speajus/diblob-mcp @speajus/diblob @modelcontextprotocol/sdk
```

**Requirements:** Node.js >= 22.0.0

## Quick Start

```typescript
import { createContainer } from '@speajus/diblob';
import { registerMcpBlobs, mcpServer } from '@speajus/diblob-mcp';

// Create a diblob container
const container = createContainer();

// Register your application blobs
// ... your blob registrations ...

// Register MCP server blobs
registerMcpBlobs(container);

// Start the MCP server
await mcpServer.start();
```

## Features

- **MCP Server**: Expose diblob containers through the Model Context Protocol
- **Container Introspection**: Query registered blobs and their dependencies
- **Dependency Graph**: Visualize the complete dependency graph
- **Type-Safe**: Full TypeScript support with type inference
- **Diblob Architecture**: Follows diblob patterns with separate interface/implementation files

## Architecture

Following diblob conventions, the package separates:

- **Interface/Blob Definitions** (`src/blobs.ts`): Type definitions and blob declarations
- **Implementations** (`src/server.ts`): Concrete MCP server and introspector implementations
- **Registration** (`src/register.ts`): `registerMcpBlobs(container)` function for grouping related registrations

## Available MCP Tools

The MCP server provides the following tools for introspecting your diblob container:

### list_blobs

List all registered blobs in the container.

**Returns:**
```json
[
  {
    "id": "Symbol(logger)",
    "name": "Logger",
    "description": "Application logger service",
    "lifecycle": "Singleton"
  },
  ...
]
```

### get_blob_details

Get detailed information about a specific blob including its dependencies.

**Parameters:**
- `blobId` (string): The ID of the blob to inspect

**Returns:**
```json
{
  "id": "Symbol(userService)",
  "name": "User Service",
  "description": "Service for managing users",
  "lifecycle": "Singleton",
  "dependencies": ["Symbol(logger)", "Symbol(database)"]
}
```

### get_dependency_graph

Get the complete dependency graph as nodes and edges.

**Returns:**
```json
{
  "nodes": [
    { "id": "Symbol(logger)", "name": "Logger" },
    { "id": "Symbol(database)", "name": "Database" },
    { "id": "Symbol(userService)", "name": "User Service" }
  ],
  "edges": [
    { "from": "Symbol(database)", "to": "Symbol(logger)" },
    { "from": "Symbol(userService)", "to": "Symbol(logger)" },
    { "from": "Symbol(userService)", "to": "Symbol(database)" }
  ]
}
```

## Custom Configuration

You can customize the MCP server configuration:

```typescript
registerMcpBlobs(container, {
  name: 'my-custom-mcp-server',
  version: '1.0.0',
  description: 'Custom MCP server for my application'
});
```

## API Reference

### registerMcpBlobs(container, config?)

Registers all MCP-related blobs with the provided container.

**Parameters:**
- `container` (Container): The diblob container to register MCP blobs with
- `config` (optional): Custom configuration object
  - `name` (string): Server name (default: 'diblob-mcp-server')
  - `version` (string): Server version (default: '0.1.0')
  - `description` (string): Server description

### Exported Blobs

- `mcpServer`: Blob for the MCP server instance
- `mcpServerConfig`: Blob for server configuration
- `mcpTransport`: Blob for the transport layer
- `containerIntrospector`: Blob for container introspection service

### Exported Types

- `McpServer`: MCP server interface
- `McpServerConfig`: Configuration interface
- `McpTransport`: Transport interface
- `ContainerIntrospector`: Introspector interface

### Exported Implementations

- `McpServerImpl`: Concrete MCP server implementation
- `StdioMcpTransport`: Stdio transport implementation
- `ContainerIntrospectorImpl`: Container introspector implementation

## License

MIT

