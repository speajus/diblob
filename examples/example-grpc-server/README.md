# Example gRPC Server

This example demonstrates how to build a gRPC server using `@speajus/diblob-connect` with a Drizzle ORM-backed database layer, all wired together with the diblob dependency injection framework.

## Features

- ✅ gRPC server with dependency injection using `@speajus/diblob-connect`
- ✅ Database integration with Drizzle ORM using a small application-level module
- ✅ SQLite database for simplicity (easily swappable with PostgreSQL/MySQL)
- ✅ Complete CRUD operations (Create, Read, Update, Delete)
- ✅ Service layer with automatic dependency resolution
- ✅ Type-safe database queries with Drizzle ORM
- ✅ **Type-safe gRPC with Protocol Buffers code generation** (see [PROTOC-TYPES.md](./PROTOC-TYPES.md))
- ✅ Database seeding with realistic fake data using `drizzle-seed`
- ✅ Graceful shutdown handling

## Project Structure

```
example-grpc-server/
├── proto/
│   └── user.proto                      # gRPC service definition
├── src/
│   ├── db/
│   │   ├── schema.ts                   # Drizzle database schema
│   │   └── seed.ts                     # Database seeding script
│   ├── generated/                      # Generated TypeScript types from proto
│   │   └── user.ts                     # Auto-generated (run proto:generate)
│   ├── grpc/
│   │   ├── user-grpc-service.ts        # gRPC service handlers (runtime)
│   │   └── user-grpc-service-typed.ts  # Type-safe gRPC handlers
│   ├── services/
│   │   └── user-service.ts             # Business logic layer
│   ├── index.ts                        # Server entry point
│   ├── client.ts                       # Test client (runtime)
│   └── client-typed.ts                 # Type-safe test client
├── drizzle.config.ts                   # Drizzle configuration
├── package.json
├── SEEDING.md                          # Database seeding documentation
├── PROTOC-TYPES.md                     # Type-safe gRPC guide
└── tsconfig.json
```

## Prerequisites

- Node.js >= 22.0.0
- npm or yarn

## Installation

From the repository root:

```bash
# Install dependencies for all packages
pnpm install

# Build the diblob packages
pnpm run build

# Navigate to the example
cd examples/example-grpc-server

# Install example dependencies
pnpm install
```

## Running the Server

```bash
# Start the server
pnpm run dev
```

The server will start on `0.0.0.0:50051`.

## Visualizing the Container Graph

This example also exposes the diblob container graph using
`@speajus/diblob-visualizer`, including the full web UI and SSE endpoints.

By default, the visualizer HTTP server listens on
`VISUALIZER_HOST:VISUALIZER_PORT`, which default to `0.0.0.0:3001`.

```bash
# From the repository root (using pnpm workspaces)
pnpm --filter example-grpc-server dev

# Or from this directory
pnpm run dev
```

Once the server is running, you can open the visualizer UI directly in your
browser:

- UI: `http://localhost:3001/`
- SSE stream: `http://localhost:3001/events`
- Graph JSON: `http://localhost:3001/graph`
- Health check: `http://localhost:3001/health`

These endpoints are powered by the shared visualizer middleware in
`@speajus/diblob-visualizer/server`, wired through the `registerVisualizerBlobs`
helper in this example.

## Database Seeding

Populate the database with realistic sample data:

```bash
# Add seed data to the database
pnpm run db:seed

# Reset database and add fresh seed data
pnpm run db:seed:reset
```

See [SEEDING.md](./SEEDING.md) for detailed documentation on database seeding.

## Testing the Server

In a separate terminal:

```bash
# Run the test client (runtime proto loading)
pnpm run client

# OR run the type-safe client (recommended)
pnpm run client:typed
```

Both clients will run through a series of tests:
1. Create a user
2. Fetch the user by ID
3. Create another user
4. List all users
5. Update a user
6. Delete a user

**💡 Tip**: The type-safe client (`client:typed`) provides full IntelliSense and compile-time type checking. See [PROTOC-TYPES.md](./PROTOC-TYPES.md) for more details.

## How It Works

### 1. Dependency Injection Setup

The application uses diblob for dependency injection:

```typescript
import { createContainer } from '@speajus/diblob';
import { registerGrpcBlobs } from '@speajus/diblob-connect';
import { registerDrizzleBlobs } from './src/drizzle.js';
import { registerTelemetryBlobs } from '@speajus/diblob-telemetry';

const container = createContainer();

// Register telemetry (OTLP or console)
registerTelemetryBlobs(container, {
  serviceName: 'example-grpc-server',
  exporter: 'console',
});

// Register gRPC server
registerGrpcBlobs(container, {
  host: '0.0.0.0',
  port: 50051,
});

// Register database client (Drizzle + better-sqlite3)
registerDrizzleBlobs(container);
```

### 2. Telemetry (Jaeger or Grafana Alloy via OTLP HTTP)

`@speajus/diblob-telemetry` config (env-driven):

| Env | Default | Notes |
| --- | --- | --- |
| `TELEMETRY_EXPORTER` | `console` | set to `otlp-http` to send to Jaeger/Alloy |
| `TELEMETRY_ENDPOINT` | unset | OTLP HTTP endpoint (e.g., `http://localhost:4318`) |
| `TELEMETRY_SAMPLE_RATIO` | `1` | 0..1 sampling for traces |
| `TELEMETRY_TRACES` | `true` | set to `false` to disable traces |
| `TELEMETRY_METRICS` | `true` | set to `false` to disable metrics |
| `SERVICE_VERSION` | unset | optional version tag |
| `DEPLOYMENT_ENVIRONMENT` | `development` | env tag |

#### Quick start: Jaeger all-in-one (OTLP HTTP 4318)

```bash
docker run --rm -it -p 16686:16686 -p 4318:4318 \
  jaegertracing/all-in-one:1.60 --collector.otlp.enabled=true

# In another shell, run the server with OTLP export
TELEMETRY_EXPORTER=otlp-http TELEMETRY_ENDPOINT=http://localhost:4318 pnpm --filter example-grpc-server dev

# Open Jaeger UI
open http://localhost:16686
```

Traces will appear under service `example-grpc-server` (sampled per `TELEMETRY_SAMPLE_RATIO`).

#### Quick start: Grafana Alloy (OTLP HTTP in, Tempo/Loki/Prom out)

Minimal Alloy config snippet (`alloy-config.alloy`):

```
otelcol.receiver.otlp "default" {
  protocols.http {}
}

otelcol.exporter.otlp "tempo" {
  endpoint = "http://tempo:4317"
}

otelcol.exporter.prometheus "prom" {
  add_metadata = true
  forward_to = []
}

otelcol.service "default" {
  pipelines = [
    { receivers = [otelcol.receiver.otlp.default], exporters = [otelcol.exporter.otlp.tempo] },
  ]
}
```

Run Alloy:

```bash
docker run --rm -it -p 4318:4318 -p 12345:12345 \
  -v "$PWD/alloy-config.alloy:/etc/alloy/config.alloy" \
  grafana/alloy:latest --config.file=/etc/alloy/config.alloy

TELEMETRY_EXPORTER=otlp-http TELEMETRY_ENDPOINT=http://localhost:4318 pnpm --filter example-grpc-server dev
```

Point Grafana Tempo UI/Prometheus at Alloy’s outputs to explore traces/metrics.

### 2. Service Layer

The `UserService` is injected with the database client:

```typescript
class UserServiceImpl implements UserService {
  constructor(private db = databaseClient) {}

  async fetchUser(id: number): Promise<User | null> {
    const db = this.db.getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }
  // ... other methods
}
```

### 3. gRPC Service Handlers

The gRPC service handlers delegate to the injected `UserService`:

```typescript
class UserGrpcService {
  constructor(private service = userService) {}

  getUser = async (call, callback) => {
    const user = await this.service.fetchUser(call.request.id);
    callback(null, { user });
  };
  // ... other handlers
}
```

### 4. Server Startup

The server is started with all dependencies automatically resolved:

```typescript
// Add service to gRPC server
grpcServer.addService(UserService.service, {
  getUser: userGrpcService.getUser,
  createUser: userGrpcService.createUser,
  // ... other methods
});

// Start the server
await grpcServer.start();
```

## Database Schema

The example uses a simple users table:

```typescript
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

## Switching to PostgreSQL or MySQL

To use PostgreSQL or MySQL instead of SQLite:

1. Install the appropriate driver:
   ```bash
   npm install postgres  # for PostgreSQL
   # or
   npm install mysql2    # for MySQL
   ```

2. Update the database configuration in your server bootstrap file (for example `src/index.ts`):
   ```typescript
   registerDrizzleBlobs(container, 'postgresql://user:password@localhost:5432/mydb');
   ```

3. Update the schema imports and initialization accordingly.

## License

MIT

