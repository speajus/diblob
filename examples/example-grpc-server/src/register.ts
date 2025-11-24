import type { Container } from "@speajus/diblob";
import { grpcServiceRegistry } from "@speajus/diblob-connect";
import { registerLoggerBlobs } from "@speajus/diblob-logger";
import { UserService } from "./generated/user_pb.js";
import { UserServiceImpl, userService } from "./user-service.js";
/**
 * Example gRPC server using diblob-connect with a Drizzle ORM-backed database
 *
 * This module demonstrates:
 * - Setting up a gRPC server with diblob-connect
 * - Integrating a database using Drizzle ORM
 * - Using dependency injection for services
 * - Implementing gRPC service handlers
 */

import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Lifecycle } from '@speajus/diblob';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './db/schema.js';
import { database, sqlite } from './drizzle.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function registerDrizzleBlobs(container: Container, dbPath: string): void {
  // Initialize database
  console.log('💾 Initializing database...');
  if (dbPath !== ':memory:') {
    mkdirSync(dirname(dbPath), { recursive: true });
  }

  container.register(sqlite, Database, dbPath, {}, {
    lifecycle: Lifecycle.Singleton,
    dispose: 'close',
  });

  container.register(database, drizzle, sqlite, { schema });
}
export async function registerUserService(container: Container): Promise<void> {
  // Ensure logger is registered (UserServiceImpl depends on it)
  // This is idempotent - if already registered, it will be re-registered
  registerLoggerBlobs(container);

  // Register the user service with its dependencies
  container.register(userService, UserServiceImpl);

  // Resolve the concrete implementation and register it with the service registry
  // before the gRPC server starts, to avoid missing routes (HTTP 404 / UNIMPLEMENTED).
  const impl = await container.resolve(userService);
  const registry = await container.resolve(grpcServiceRegistry);
  registry.registerService(UserService, impl);
}