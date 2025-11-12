# Type-Safe gRPC with Protocol Buffers

This example demonstrates how to use `protoc` to generate type-safe TypeScript code from Protocol Buffer definitions.

## Overview

Instead of using `@grpc/proto-loader` which loads proto files at runtime with `any` types, we use `ts-proto` to generate fully type-safe TypeScript code at build time.

## Benefits

✅ **Full Type Safety**: All request/response types are strongly typed  
✅ **IntelliSense Support**: Get autocomplete for all proto message fields  
✅ **Compile-Time Validation**: Catch errors before runtime  
✅ **Better Developer Experience**: No more guessing field names or types  

## Setup

### 1. Install Dependencies

```bash
pnpm add -D grpc-tools @types/google-protobuf ts-proto @bufbuild/protobuf
```

### 2. Generate TypeScript Types

Run the code generation script:

```bash
pnpm run proto:generate
```

This will:
- Read all `.proto` files from the `proto/` directory
- Generate TypeScript types in `src/generated/`
- Create type-safe client and server interfaces

### 3. Generated Files

The generated `src/generated/user.ts` file contains:

- **Message Types**: `User`, `GetUserRequest`, `GetUserResponse`, etc.
- **Service Client**: `UserServiceClient` - type-safe client class
- **Service Server**: `UserServiceServer` - interface for server implementation
- **Service Definition**: `UserServiceService` - service metadata for gRPC

## Usage

### Type-Safe Client

<augment_code_snippet path="examples/example-grpc-server/src/client-typed.ts" mode="EXCERPT">
````typescript
import { UserServiceClient, type CreateUserRequest } from './generated/user.js';

const client = new UserServiceClient('localhost:50051', credentials);

// Fully type-safe request
const request: CreateUserRequest = {
  name: 'John Doe',
  email: 'john@example.com',
};

client.createUser(request, (error, response) => {
  // response is typed as CreateUserResponse
  console.log(response.user?.id);
});
````
</augment_code_snippet>

### Type-Safe Server

<augment_code_snippet path="examples/example-grpc-server/src/grpc/user-grpc-service-typed.ts" mode="EXCERPT">
````typescript
import type { UserServiceServer, GetUserRequest, GetUserResponse } from '../generated/user.js';

export class UserGrpcServiceTyped implements UserServiceServer {
  getUser: grpc.handleUnaryCall<GetUserRequest, GetUserResponse> = async (call, callback) => {
    const { id } = call.request; // id is typed as number
    // ... implementation
  };
}
````
</augment_code_snippet>

## Running the Examples

### Start the Server

```bash
pnpm run dev
```

### Run the Type-Safe Client

```bash
pnpm run client:typed
```

### Run the Original Client (for comparison)

```bash
pnpm run client
```

## Proto Generation Options

The `proto:generate` script uses these `ts-proto` options:

- `outputServices=grpc-js`: Generate gRPC-JS compatible service definitions
- `env=node`: Generate Node.js compatible code
- `esModuleInterop=true`: Enable ES module interop

## Workflow

1. **Edit Proto Files**: Modify `.proto` files in the `proto/` directory
2. **Regenerate Types**: Run `pnpm run proto:generate`
3. **Update Code**: TypeScript will show errors if your code doesn't match the new types
4. **Fix Errors**: Update your implementation to match the new types

## Comparison: Runtime vs Build-Time Types

### Runtime Loading (Original)

```typescript
// ❌ No type safety
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const UserService = protoDescriptor.user.UserService;

client.createUser({ name: 'John', email: 'john@example.com' }, (error: any, response: any) => {
  console.log(response.user.id); // No autocomplete, no type checking
});
```

### Build-Time Generation (Type-Safe)

```typescript
// ✅ Full type safety
import { UserServiceClient, type CreateUserRequest } from './generated/user.js';

const request: CreateUserRequest = { name: 'John', email: 'john@example.com' };
client.createUser(request, (error, response) => {
  console.log(response.user?.id); // Full autocomplete and type checking
});
```

## Additional Resources

- [ts-proto Documentation](https://github.com/stephenh/ts-proto)
- [gRPC-JS Documentation](https://grpc.github.io/grpc/node/)
- [Protocol Buffers Guide](https://protobuf.dev/)

