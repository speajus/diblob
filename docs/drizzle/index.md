# Database integration with Drizzle ORM

This page shows how to integrate [Drizzle ORM](https://orm.drizzle.team/) with a diblob container using the example gRPC server in this repository.

Instead of a separate database integration package, the Drizzle setup now lives entirely inside the example at

- `examples/example-grpc-server/src/drizzle.ts`

The goal is to demonstrate a concrete pattern you can copy into your own applications.

## Overview

The example uses two blobs:

- `sqlite` – wraps the underlying SQLite connection (created with `better-sqlite3`)
- `database` – wraps the Drizzle ORM database instance configured with the schema

Both blobs are registered via a helper function `registerDrizzleBlobs(container, dbPath?)`.

## Registration helper

The helper takes a diblob container and an optional database path, ensures the directory exists, and then registers the low-level database and the Drizzle ORM instance:

```ts
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './db/schema.js';
import { type Container, createBlob, Lifecycle } from '@speajus/diblob';

export const sqlite = createBlob<InstanceType<typeof Database>>('sqlite');
export const database = createBlob<any>('db');

export function registerDrizzleBlobs(container: Container, dbPath: string) {
  mkdirSync(dirname(dbPath), { recursive: true });

  container.register(sqlite, Database, dbPath, {}, {
    lifecycle: Lifecycle.Singleton,
    dispose: 'close',
  });

  container.register(database, drizzle, sqlite, { schema });
}
```

In the example, this helper is called from the gRPC server startup code after the logger and gRPC server blobs are registered.

## Using the database in services

The `database` blob is used directly as a Drizzle database instance in the user service implementation:

```ts
import { eq } from 'drizzle-orm';
import { users } from './db/schema.js';
import { database } from './drizzle.js';

export class UserServiceImpl {
  constructor(private db = database) {}

  async listUsers(limit = 10, offset = 0) {
    return this.db.select().from(users).limit(limit).offset(offset);
  }
}
```

This pattern keeps your database access code type-safe and testable while fitting naturally into diblob's dependency injection model.

## Full example

For a complete working setup (including schema, seeding, gRPC handlers, and graceful shutdown), see the
[example-grpc-server](https://github.com/speajus/diblob/tree/main/examples/example-grpc-server).

