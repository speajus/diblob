# `@speajus/diblob-connect`

Connect-based gRPC server integration for diblob containers.

`@speajus/diblob-connect` provides a gRPC/Connect server implementation using
[Connect-ES](https://github.com/connectrpc/connect-es) that is wired through a
diblob container. It lets you configure the server via blobs and resolves
service implementations from the container.

## Installation

```bash
pnpm add @speajus/diblob-connect @speajus/diblob @connectrpc/connect @connectrpc/connect-node @bufbuild/protobuf
```

Requires Node.js >= 22.

## Quick start

```ts
import { createContainer } from '@speajus/diblob';
import {
  registerGrpcBlobs,
  grpcServer,
  grpcServiceRegistry,
} from '@speajus/diblob-connect';
import { YourService } from './gen/your_connect.js';

const container = createContainer();

registerGrpcBlobs(container, {
  host: '0.0.0.0',
  port: 50051,
});

grpcServiceRegistry.registerService(YourService, {
  async yourMethod(request) {
    // ... implement service logic
    return { /* response */ } as any;
  },
});

await container.resolve(grpcServer);
```

The registration uses lifecycle hooks so the server starts on first resolve and
stops when the container (or relevant blobs) are disposed.

## Configuration

`registerGrpcBlobs(container, config?)` accepts a configuration object with
fields such as:

- `host` – host to bind to (default `0.0.0.0`).
- `port` – port to listen on (default `50051`).
- `requestPathPrefix` – optional URL prefix for all RPCs.

You can construct this config from env or typed config, for example:

```ts
import { z } from 'zod';
import { createContainer } from '@speajus/diblob';
import { type ConfigSchema, loadNodeConfig } from '@speajus/diblob-config';
import { registerGrpcBlobs } from '@speajus/diblob-connect';

type GrpcConfig = {
  host: string;
  port: number;
};

const GrpcConfigSchema = z.object({
  host: z.string().default('0.0.0.0'),
  port: z.number().int().min(1).max(65535).default(50051),
}) satisfies ConfigSchema<GrpcConfig>;

const container = createContainer();

const grpcConfig = loadNodeConfig<GrpcConfig>({
  schema: GrpcConfigSchema,
  envPrefix: 'GRPC_',
});

registerGrpcBlobs(container, grpcConfig);
```

## Blobs

Common blobs exposed by this package include:

- `grpcServer` – the running server instance.
- `grpcServerConfig` – configuration used to create the server.
- `grpcServiceRegistry` – a registry used to register service implementations.

Check the TypeScript declarations in `@speajus/diblob-connect` for the exact
blob types.

## Examples

A full example lives in the `examples/example-grpc-server` directory of the
repository and demonstrates:

- Container-based registration of server and services.
- Integration with testing utilities from `@speajus/diblob-testing`.
- Telemetry and logging integration when combined with other packages.

