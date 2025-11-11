# diblob-drizzle

Drizzle ORM integration for diblob dependency injection containers.

## Overview

`@speajus/diblob-drizzle` provides a database client wrapper that integrates Drizzle ORM with diblob's dependency injection system, allowing you to manage database connections and queries with automatic dependency resolution.

## Installation

```bash
npm install @speajus/diblob-drizzle @speajus/diblob drizzle-orm
```

You'll also need to install the appropriate database driver:

```bash
# For PostgreSQL
npm install postgres

# For MySQL
npm install mysql2

# For SQLite
npm install better-sqlite3
```

**Requirements:** Node.js >= 22.0.0

## Quick Start

### PostgreSQL Example

```typescript
import { createContainer } from '@speajus/diblob';
import { registerDrizzleBlobs, databaseClient } from '@speajus/diblob-drizzle';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Create a diblob container
const container = createContainer();

// Register Drizzle blobs
registerDrizzleBlobs(container, {
  driver: 'postgres',
  connection: 'postgresql://user:password@localhost:5432/mydb',
  logging: true
});

// Initialize with actual Drizzle instance
const client = postgres('postgresql://user:password@localhost:5432/mydb');
const db = drizzle(client);
await databaseClient.initialize(db);

// Use the database
const users = await databaseClient.getDb().select().from(usersTable);
```

### SQLite Example

```typescript
import { registerDrizzleBlobs, databaseClient } from '@speajus/diblob-drizzle';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

registerDrizzleBlobs(container, {
  driver: 'better-sqlite3',
  connection: './data/app.db',
  logging: true
});

const sqlite = new Database('./data/app.db');
const db = drizzle(sqlite);
await databaseClient.initialize(db);
```

## Features

- **Database Client**: Type-safe database client with dependency injection
- **Connection Management**: Automatic connection lifecycle management
- **Migration Support**: Built-in migration runner interface
- **Multiple Drivers**: Support for PostgreSQL, MySQL, and SQLite
- **Type-Safe**: Full TypeScript support with Drizzle ORM
- **Diblob Architecture**: Follows diblob patterns with separate interface/implementation files

## Architecture

Following diblob conventions, the package separates:

- **Interface/Blob Definitions** (`src/blobs.ts`): Type definitions and blob declarations
- **Implementations** (`src/client.ts`): Concrete database client implementations
- **Registration** (`src/register.ts`): `registerDrizzleBlobs(container)` function for grouping related registrations

## Configuration

### Connection String

```typescript
registerDrizzleBlobs(container, {
  driver: 'postgres',
  connection: 'postgresql://user:password@localhost:5432/mydb'
});
```

### Connection Object

```typescript
registerDrizzleBlobs(container, {
  driver: 'postgres',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    user: 'user',
    password: 'password',
    ssl: true
  },
  logging: true
});
```

## Using with Services

The database client can be injected into your services:

```typescript
import { createBlob, createContainer } from '@speajus/diblob';
import { databaseClient } from '@speajus/diblob-drizzle';
import { eq } from 'drizzle-orm';

interface UserService {
  fetchUser(id: number): Promise<User>;
  createUser(name: string, email: string): Promise<User>;
}

class UserServiceImpl implements UserService {
  constructor(private db = databaseClient) {}

  async fetchUser(id: number): Promise<User> {
    const [user] = await this.db.getDb()
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async createUser(name: string, email: string): Promise<User> {
    const [user] = await this.db.getDb()
      .insert(users)
      .values({ name, email })
      .returning();
    return user;
  }
}

const userService = createBlob<UserService>('userService');
container.register(userService, UserServiceImpl, databaseClient);
```

## API Reference

### registerDrizzleBlobs(container, config)

Registers all Drizzle ORM-related blobs with the provided container.

**Parameters:**
- `container` (Container): The diblob container to register Drizzle blobs with
- `config` (DatabaseConfig): Database configuration object
  - `driver` (string): Database driver type ('postgres', 'mysql', 'sqlite', 'better-sqlite3')
  - `connection` (string | object): Connection string or configuration object
  - `options` (object): Additional driver-specific options
  - `logging` (boolean): Enable query logging

### Exported Blobs

- `databaseClient`: Blob for the database client instance
- `databaseConfig`: Blob for database configuration
- `databaseConnectionManager`: Blob for connection lifecycle manager
- `migrationRunner`: Blob for database migration runner

### Exported Types

- `DatabaseClient`: Database client interface
- `DatabaseConfig`: Configuration interface
- `DatabaseConnectionManager`: Connection manager interface
- `MigrationRunner`: Migration runner interface

### Exported Implementations

- `DatabaseClientImpl`: Concrete database client implementation
- `DatabaseConnectionManagerImpl`: Connection manager implementation
- `MigrationRunnerImpl`: Migration runner implementation

## Example

See the complete [example-grpc-server](https://github.com/speajus/diblob/tree/main/examples/example-grpc-server) for a full working example that demonstrates:

- Setting up a database with diblob-drizzle
- Integrating with a gRPC server using diblob-grpc
- Using dependency injection for database access
- Implementing CRUD operations with Drizzle ORM

## License

MIT

