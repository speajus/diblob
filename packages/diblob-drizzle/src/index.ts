/**
 * @speajus/diblob-drizzle
 * 
 * Drizzle ORM integration for diblob dependency injection containers
 * 
 * @example
 * ```typescript
 * import { createContainer } from '@speajus/diblob';
 * import { registerDrizzleBlobs, databaseClient } from '@speajus/diblob-drizzle';
 * import { drizzle } from 'drizzle-orm/postgres-js';
 * import postgres from 'postgres';
 * 
 * const container = createContainer();
 * registerDrizzleBlobs(container, {
 *   driver: 'postgres',
 *   connection: 'postgresql://user:password@localhost:5432/mydb'
 * });
 * 
 * // Initialize with actual Drizzle instance
 * const client = postgres('postgresql://user:password@localhost:5432/mydb');
 * const db = drizzle(client);
 * await databaseClient.initialize(db);
 * 
 * // Use the database
 * const result = await databaseClient.getDb().select().from(users);
 * ```
 */

// Export registration function
export { registerDrizzleBlobs } from './register.js';

// Export blob declarations
export {
  databaseConfig,
  databaseClient,
  databaseConnectionManager,
  migrationRunner
} from './blobs.js';

// Export types
export type {
  DatabaseConfig,
  DatabaseClient,
  DatabaseConnectionManager,
  MigrationRunner
} from './blobs.js';

// Export implementations (for advanced use cases)
export {
  DatabaseClientImpl,
  DatabaseConnectionManagerImpl,
  MigrationRunnerImpl
} from './client.js';

