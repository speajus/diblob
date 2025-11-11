# Example gRPC Server

This example demonstrates how to build a gRPC server using `@speajus/diblob-grpc` and `@speajus/diblob-drizzle` with the diblob dependency injection framework.

## Features

- ✅ gRPC server with dependency injection using `@speajus/diblob-grpc`
- ✅ Database integration with Drizzle ORM using `@speajus/diblob-drizzle`
- ✅ SQLite database for simplicity (easily swappable with PostgreSQL/MySQL)
- ✅ Complete CRUD operations (Create, Read, Update, Delete)
- ✅ Service layer with automatic dependency resolution
- ✅ Type-safe database queries with Drizzle ORM
- ✅ Graceful shutdown handling

## Project Structure

```
example-grpc-server/
├── proto/
│   └── user.proto              # gRPC service definition
├── src/
│   ├── db/
│   │   └── schema.ts           # Drizzle database schema
│   ├── grpc/
│   │   └── user-grpc-service.ts # gRPC service handlers
│   ├── services/
│   │   └── user-service.ts     # Business logic layer
│   ├── index.ts                # Server entry point
│   └── client.ts               # Test client
├── drizzle.config.ts           # Drizzle configuration
├── package.json
└── tsconfig.json
```

## Prerequisites

- Node.js >= 22.0.0
- npm or yarn

## Installation

From the repository root:

```bash
# Install dependencies for all packages
npm install

# Build the diblob packages
npm run build

# Navigate to the example
cd examples/example-grpc-server

# Install example dependencies
npm install
```

## Running the Server

```bash
# Start the server
npm run dev
```

The server will start on `0.0.0.0:50051`.

## Testing the Server

In a separate terminal:

```bash
# Run the test client
tsx src/client.ts
```

This will run through a series of tests:
1. Create a user
2. Fetch the user by ID
3. Create another user
4. List all users
5. Update a user
6. Delete a user

## How It Works

### 1. Dependency Injection Setup

The application uses diblob for dependency injection:

```typescript
import { createContainer } from '@speajus/diblob';
import { registerGrpcBlobs } from '@speajus/diblob-grpc';
import { registerDrizzleBlobs } from '@speajus/diblob-drizzle';

const container = createContainer();

// Register gRPC server
registerGrpcBlobs(container, {
  host: '0.0.0.0',
  port: 50051
});

// Register database client
registerDrizzleBlobs(container, {
  driver: 'better-sqlite3',
  connection: './data/app.db'
});
```

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

2. Update the database configuration in `src/index.ts`:
   ```typescript
   registerDrizzleBlobs(container, {
     driver: 'postgres',
     connection: 'postgresql://user:password@localhost:5432/mydb'
   });
   ```

3. Update the schema imports and initialization accordingly.

## License

MIT

