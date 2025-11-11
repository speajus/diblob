# @speajus/diblob-grpc

gRPC server implementation for [diblob](https://github.com/speajus/diblob) dependency injection containers.

This package provides a gRPC server that integrates seamlessly with diblob's dependency injection system, allowing you to build gRPC services with automatic dependency resolution.

## Installation

```bash
npm install @speajus/diblob-grpc @speajus/diblob @grpc/grpc-js @grpc/proto-loader
```

Requirements: Node.js >= 22.0.0

## Quick Start

```typescript
import { createContainer } from '@speajus/diblob';
import { registerGrpcBlobs, grpcServer, grpcServiceRegistry } from '@speajus/diblob-grpc';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

// Create a diblob container
const container = createContainer();

// Register gRPC server blobs
registerGrpcBlobs(container, {
  host: '0.0.0.0',
  port: 50051
});

// Load your proto file
const packageDefinition = protoLoader.loadSync('path/to/your.proto');
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

// Register your service implementation with the registry (does not start the server yet)
grpcServiceRegistry.registerService(
  protoDescriptor.YourService.service,
  {
    yourMethod: (call, callback) => {
      // Your implementation
      callback(null, { message: 'Hello!' });
    }
  }
);

// Resolve the grpcServer blob to start the server.
// The registration uses lifecycle hooks to call server.start() for you.
await container.resolve(grpcServer);
console.log('gRPC server running on port 50051');
```

## Architecture

Following diblob conventions, this package separates:

- **Interface/Blob Definitions** (`src/blobs.ts`): Type definitions and blob declarations
- **Implementations** (`src/server.ts`): Concrete gRPC server implementation
- **Registration** (`src/register.ts`): Registration function that accepts a container

## API Reference

### `registerGrpcBlobs(container, config?)`

Registers all gRPC-related blobs with the provided container.

```typescript
import { createContainer } from '@speajus/diblob';
import { registerGrpcBlobs } from '@speajus/diblob-grpc';

const container = createContainer();
registerGrpcBlobs(container, {
  host: 'localhost',
  port: 9090
});
```

### Configuration Options

- `host` (string): Host to bind the server to (default: '0.0.0.0')
- `port` (number): Port to bind the server to (default: 50051)
- `credentials` (grpc.ServerCredentials): Server credentials (default: insecure)
- `options` (grpc.ChannelOptions): Additional server options

### Blobs

- `grpcServer`: The main gRPC server instance
- `grpcServerConfig`: Server configuration
- `grpcServiceRegistry`: Registry for managing service implementations

## Lifecycle

The `registerGrpcBlobs` helper registers the `grpcServer` blob as a `Lifecycle.Singleton`
with lifecycle hooks:

- `initialize: 'start'` – called the first time the blob is resolved
- `dispose: 'stop'` – called when the blob is invalidated (for example, when
  it or one of its dependencies is re-registered or unregistered)

This means:

- The server starts automatically the first time you resolve `grpcServer`,
  e.g. with `await container.resolve(grpcServer)`.
- The server is stopped automatically when its registration (or its
  dependencies) are invalidated, following diblob's cascading disposal
  semantics.

## Examples

See the [example-grpc-server](../../examples/example-grpc-server) for a complete working example.

## License

MIT

