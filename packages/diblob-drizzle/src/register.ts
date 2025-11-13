/**
 * Registration function for Drizzle ORM blobs
 *
 * Following diblob architecture patterns, this file contains the registration
 * function that accepts a container parameter and registers all Drizzle-related blobs.
 */

import type { IContainer } from '@speajus/diblob';
import {
  type DatabaseConfig, 
  databaseClient,
  databaseConfig,
  databaseConnectionManager,
  migrationRunner
} from './blobs.js';
import {
  DatabaseClientImpl,
  DatabaseConnectionManagerImpl,
  MigrationRunnerImpl
} from './client.js';

/**
 * Register all Drizzle ORM-related blobs with the provided container
 * 
 * This function follows the diblob pattern of grouping related blob
 * registrations into a single function that accepts a container parameter.
 * 
 * Note: This registers the base implementations. For specific database drivers
 * (PostgreSQL, MySQL, SQLite), you should provide a custom DatabaseClient
 * implementation or use driver-specific registration functions.
 * 
 * @param container - The diblob container to register Drizzle blobs with
 * @param config - Database configuration
 * 
 * @example
 * ```typescript
 * import { createContainer } from '@speajus/diblob';
 * import { registerDrizzleBlobs } from '@speajus/diblob-drizzle';
 * 
 * const container = createContainer();
 * registerDrizzleBlobs(container, {
 *   driver: 'postgres',
 *   connection: 'postgresql://user:password@localhost:5432/mydb'
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // With detailed configuration
 * import { createContainer } from '@speajus/diblob';
 * import { registerDrizzleBlobs } from '@speajus/diblob-drizzle';
 * 
 * const container = createContainer();
 * registerDrizzleBlobs(container, {
 *   driver: 'postgres',
 *   connection: {
 *     host: 'localhost',
 *     port: 5432,
 *     database: 'mydb',
 *     user: 'user',
 *     password: 'password'
 *   },
 *   logging: true
 * });
 * ```
 */
export function registerDrizzleBlobs(
  container: IContainer,
  config: DatabaseConfig
): void {
  // Register database configuration
  container.register(databaseConfig, () => config);

  // Register connection manager
  container.register(
    databaseConnectionManager,
    DatabaseConnectionManagerImpl,
    databaseConfig
  );

  // Register database client
  container.register(
    databaseClient,
    DatabaseClientImpl,
    databaseConfig,
    databaseConnectionManager
  );

  // Register migration runner
  container.register(
    migrationRunner,
    MigrationRunnerImpl,
    databaseConfig,
    databaseClient
  );
}

