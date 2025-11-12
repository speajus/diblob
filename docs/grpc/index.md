# diblob-connect

Connect-based gRPC server implementation for diblob dependency injection containers.

## Overview

`@speajus/diblob-connect` provides a Connect/gRPC server that integrates seamlessly with diblob's dependency injection system, allowing you to build modern gRPC/Connect/gRPC-Web services with automatic dependency resolution.

## Installation

```bash
pnpm add @speajus/diblob-connect @speajus/diblob @connectrpc/connect @connectrpc/connect-node @bufbuild/protobuf
```

**Requirements:** Node.js >= 22.0.0

## Quick Start

```typescript
import { createContainer } from '@speajus/diblob';
import {
  registerGrpcBlobs,
  grpcServer,
  grpcServiceRegistry,
} from '@speajus/diblob-connect';
import { YourService } from './gen/your_connect.js'; // from protoc-gen-es / protoc-gen-connect-es

// Create a diblob container
const container = createContainer();

// Register gRPC/Connect server blobs
registerGrpcBlobs(container, {
  host: '0.0.0.0',
  port: 50051,
  // optional: requestPathPrefix: '/api',
});

// Register your generated service descriptor + implementation with the
// service registry. The types come directly from Connect-ES codegen.
grpcServiceRegistry.registerService(YourService, {
  async yourMethod(request) {
    // ...
    return { /* response */ };
  },
});

// Resolve the grpcServer blob to start the server.
// The registration uses lifecycle hooks to call server.start() for you.
await container.resolve(grpcServer);
console.log('gRPC server running on port 50051');
```

## Features

- **gRPC Server**: Full-featured gRPC server with dependency injection
- **Service Registry**: Manage multiple gRPC services
- **Type-Safe**: Full TypeScript support with type inference
- **Flexible Configuration**: Customize host, port, credentials, and options
- **Diblob Architecture**: Follows diblob patterns with separate interface/implementation files

## Architecture

Following diblob conventions, the package separates:

- **Interface/Blob Definitions** (`src/blobs.ts`): Type definitions and blob declarations
- **Implementations** (`src/server.ts`): Concrete gRPC server implementation
- **Registration** (`src/register.ts`): `registerGrpcBlobs(container)` function for grouping related registrations

## Configuration

### Basic Configuration

```typescript
registerGrpcBlobs(container, {
  host: 'localhost',
  port: 9090
});
```

### Advanced Configuration

```typescript
registerGrpcBlobs(container, {
  host: '0.0.0.0',
  port: 50051,
  requestPathPrefix: '/api',
});
```

## Using with Dependency Injection

The real power of `@speajus/diblob-connect` comes from integrating it with your injected services:

```typescript
import { createBlob, createContainer } from '@speajus/diblob';
import { grpcServer } from '@speajus/diblob-connect';

// Define your service
interface UserService {
  fetchUser(id: number): Promise<User>;
}

const userService = createBlob<UserService>('userService');

// Implement with dependency injection
class UserServiceImpl implements UserService {
  constructor(private db = databaseClient) {}
  
  async fetchUser(id: number): Promise<User> {
    return this.db.getDb().select().from(users).where(eq(users.id, id));
  }
}

// Register the service
container.register(userService, UserServiceImpl, databaseClient);

// Create gRPC handlers that use the injected service
class UserGrpcService {
  constructor(private service = userService) {}
  
  getUser = async (call, callback) => {
    const user = await this.service.fetchUser(call.request.id);
    callback(null, { user });
  };
}

// Add to gRPC server
const userGrpcService = new UserGrpcService(userService);
grpcServer.addService(UserService.service, {
  getUser: userGrpcService.getUser
});
```

## API Reference

### registerGrpcBlobs(container, config?)

Registers all gRPC-related blobs with the provided container.

  **Parameters:**
  - `container` (Container): The diblob container to register gRPC blobs with
  - `config` (optional): Custom configuration object
    - `host` (string): Host to bind the server to (default: '0.0.0.0')
    - `port` (number): Port to bind the server to (default: 50051)
    - `requestPathPrefix` (string): Optional URL prefix for all RPCs (default: '')

### Exported Blobs

- `grpcServer`: Blob for the gRPC server instance
- `grpcServerConfig`: Blob for server configuration
- `grpcServiceRegistry`: Blob for service registry

### Exported Types

- `GrpcServer`: gRPC server interface
- `GrpcServerConfig`: Configuration interface
- `GrpcServiceRegistry`: Service registry interface

### Exported Implementations

- `GrpcServerImpl`: Concrete gRPC server implementation
- `GrpcServiceRegistryImpl`: Service registry implementation

## Example

See the complete [example-grpc-server](https://github.com/speajus/diblob/tree/main/examples/example-grpc-server) for a full working example that demonstrates:

- Setting up a gRPC server with diblob-connect
- Integrating a database with diblob-drizzle
- Using dependency injection for services
- Implementing CRUD operations

## License

MIT

