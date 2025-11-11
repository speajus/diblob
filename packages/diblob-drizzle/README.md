# @speajus/diblob-drizzle

Drizzle ORM integration for [diblob](https://github.com/speajus/diblob) dependency injection containers.

This package provides a database client wrapper that integrates Drizzle ORM with diblob's dependency injection system, allowing you to manage database connections and queries with automatic dependency resolution.

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

Requirements: Node.js >= 22.0.0

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

## Architecture

Following diblob conventions, this package separates:

- **Interface/Blob Definitions** (`src/blobs.ts`): Type definitions and blob declarations
- **Implementations** (`src/client.ts`): Concrete database client implementations
- **Registration** (`src/register.ts`): Registration function that accepts a container

## API Reference

### `registerDrizzleBlobs(container, config)`

Registers all Drizzle ORM-related blobs with the provided container.

```typescript
import { createContainer } from '@speajus/diblob';
import { registerDrizzleBlobs } from '@speajus/diblob-drizzle';

const container = createContainer();
registerDrizzleBlobs(container, {
  driver: 'postgres',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    user: 'user',
    password: 'password'
  },
  logging: true
});
```

### Configuration Options

- `driver` (string): Database driver type ('postgres', 'mysql', 'sqlite', 'better-sqlite3')
- `connection` (string | object): Connection string or configuration object
- `options` (object): Additional driver-specific options
- `logging` (boolean): Enable query logging

### Blobs

- `databaseClient`: The main database client instance
- `databaseConfig`: Database configuration
- `databaseConnectionManager`: Connection lifecycle manager
- `migrationRunner`: Database migration runner

## Usage with Services

```typescript
import { createBlob, createContainer } from '@speajus/diblob';
import { databaseClient } from '@speajus/diblob-drizzle';

interface UserService {
  fetchUser(id: number): Promise<User>;
}

class UserServiceImpl implements UserService {
  constructor(private db = databaseClient) {}

  async fetchUser(id: number): Promise<User> {
    const [user] = await this.db.getDb()
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    return user;
  }
}

const userService = createBlob<UserService>('userService');
container.register(userService, UserServiceImpl, databaseClient);
```

## Examples

See the [example-grpc-server](../../examples/example-grpc-server) for a complete working example.

## License

MIT

