---
layout: home

hero:
  name: Diblob
  text: Dependency Injection Framework
  tagline: A modern DI framework where the proxy (blob) is the key
  actions:
    - theme: brand
      text: Get Started
      link: /diblob/guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/speajus/diblob

features:
  - icon: 🎯
    title: Proxy-Based DI
    details: Uses JavaScript Proxies as unique identifiers for dependencies, eliminating the need for string tokens or symbols.
  
  - icon: ⚡
    title: Reactive Dependencies
    details: Automatically invalidates and re-resolves dependent services when dependencies are re-registered.
  
  - icon: 🔄
    title: Async Support
    details: First-class support for async factories and dependencies with automatic promise resolution.
  
  - icon: 🏗️
    title: Constructor Injection
    details: Automatically detects and injects blob dependencies from constructor default parameters.
  
  - icon: 🎨
    title: Interactive Visualizer
    details: Visualize your dependency graph with an interactive, real-time graph visualization tool.

  - icon: 🤖
    title: MCP Server
    details: Expose container functionality through Model Context Protocol for AI assistant integration.

  - icon: 🌐
    title: Connect/gRPC Integration
    details: Build Connect/gRPC servers with automatic dependency injection using diblob-connect.

  - icon: 🗄️
    title: Database Integration
    details: Integrate Drizzle ORM (and other ORMs) with diblob containers using application-level blobs.

  - icon: 🏷️
    title: Metadata Support
    details: Attach custom metadata to blobs and containers for better debugging and documentation.
---

## Quick Start

### Installation

```bash
npm install @speajus/diblob
```

### Basic Usage

```typescript
import { createBlob, createContainer } from '@speajus/diblob';

// Define your service interface
interface Logger {
  log(message: string): void;
}

// Create a blob (proxy) for the service
const logger = createBlob<Logger>('logger', {
  name: 'Console Logger',
  description: 'Logs messages to the console'
});

// Create a container
const container = createContainer();

// Register the implementation
class ConsoleLogger implements Logger {
  log(message: string) {
    console.log(message);
  }
}

container.register(logger, ConsoleLogger);

// Use the service
logger.log('Hello, Diblob!');
```

## Packages

### @speajus/diblob

The core dependency injection framework.

- [Documentation](/diblob/guide/getting-started)
- [API Reference](/diblob/api/)
- [Examples](/diblob/examples/)

### @speajus/diblob-mcp

Model Context Protocol server for diblob containers.

- [Documentation](/mcp/)
- [Getting Started](/mcp/getting-started)
- [Examples](/mcp/examples)

### @speajus/diblob-connect

Connect-based gRPC server implementation for diblob containers.

- [Documentation](/grpc/)
- [Example Application](https://github.com/speajus/diblob/tree/main/examples/example-grpc-server)

### @speajus/diblob-visualizer

Interactive visualization tool for your dependency graphs.

- [Documentation](/visualizer/)
- [Getting Started](/visualizer/getting-started)
- [API Reference](/visualizer/api)

### @speajus/diblob-telemetry

OpenTelemetry instrumentation for diblob containers.

- [Documentation](/diblob/telemetry)

## Features

### Proxy-Based Keys

Unlike traditional DI frameworks that use strings or symbols, Diblob uses JavaScript Proxies as keys. This provides type safety and eliminates naming conflicts.

### Reactive Dependencies

When you re-register a service, all dependent services are automatically invalidated and re-resolved on next access.

### Async Support

Full support for async factories and dependencies:

```typescript
container.register(database, async () => {
  await connectToDatabase();
  return new DatabaseService();
});
```

### Constructor Injection

Automatically inject dependencies via constructor default parameters:

```typescript
class UserService {
  constructor(
    private logger = logger,
    private database = database
  ) {}
}
```

### Metadata

Attach rich metadata to blobs and containers:

```typescript
const userService = createBlob<UserService>('userService', {
  name: 'User Service',
  description: 'Manages user data',
  version: '1.0.0',
  tags: ['business', 'core']
});
```

## License

MIT

