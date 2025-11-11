# @speajus/diblob-mcp

Model Context Protocol (MCP) server implementation for diblob dependency injection containers.

## Overview

`@speajus/diblob-mcp` provides an MCP server that exposes diblob container functionality through the Model Context Protocol, enabling AI assistants and other MCP clients to interact with your dependency injection containers.

## Features

- **MCP Server**: Expose diblob containers through the Model Context Protocol
- **Container Introspection**: Query registered blobs and their dependencies
- **Dynamic Registration**: Register and unregister blobs through MCP tools
- **Type-Safe**: Full TypeScript support with type inference
- **Diblob Architecture**: Follows diblob patterns with separate interface/implementation files

## Installation

```bash
npm install @speajus/diblob-mcp @speajus/diblob @modelcontextprotocol/sdk
```

Requirements: Node.js >= 22.0.0

## Quick Start

```typescript
import { createContainer } from '@speajus/diblob';
import { registerMcpBlobs } from '@speajus/diblob-mcp';

// Create a diblob container
const container = createContainer();

// Register MCP server blobs
registerMcpBlobs(container);

// The MCP server is now available through the container
```

## Architecture

Following diblob conventions, this package separates:

- **Interface/Blob Definitions** (`src/blobs.ts`): Type definitions and blob declarations
- **Implementations** (`src/server.ts`): Concrete MCP server implementation
- **Registration** (`src/register.ts`): Registration function that accepts a container

## API Reference

### `registerMcpBlobs(container)`

Registers all MCP-related blobs with the provided container.

```typescript
import { createContainer } from '@speajus/diblob';
import { registerMcpBlobs } from '@speajus/diblob-mcp';

const container = createContainer();
registerMcpBlobs(container);
```

## License

MIT

