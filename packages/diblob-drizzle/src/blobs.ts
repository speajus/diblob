/**
 * Blob and interface definitions for Drizzle ORM
 * 
 * This file contains type definitions and blob declarations following
 * diblob architecture patterns.
 */

import { createBlob } from '@speajus/diblob';

/**
 * Configuration for the database connection
 */
export interface DatabaseConfig {
  /**
   * Database connection string or configuration
   */
  connection: string | {
    host: string;
    port?: number;
    database: string;
    user?: string;
    password?: string;
    ssl?: boolean;
  };

  /**
   * Database driver type
   */
  driver: 'postgres' | 'mysql' | 'sqlite' | 'better-sqlite3';

  /**
   * Additional driver-specific options
   */
  options?: Record<string, unknown>;

  /**
   * Enable logging
   */
  logging?: boolean;
}

/**
 * Database client interface
 * Generic wrapper around Drizzle database instances
 */
export interface DatabaseClient<TDatabase = unknown> {
  /**
   * Initialize the database connection with a Drizzle instance
   */
  initialize(db: TDatabase): Promise<void>;

  /**
   * Get the underlying Drizzle database instance
   */
  getDb(): TDatabase;

  /**
   * Execute a raw SQL query
   */
  // biome-ignore lint/suspicious/noExplicitAny: any is appropriate here
  execute<T = any>(query: string, params?: any[]): Promise<T>;

  /**
   * Begin a transaction
   */
  transaction<T>(callback: (tx: TDatabase) => Promise<T>): Promise<T>;

  /**
   * Close the database connection
   */
  close(): Promise<void>;

  /**
   * Check if the connection is active
   */
  isConnected(): boolean;
}

/**
 * Database connection manager
 * Handles connection lifecycle and pooling
 */
export interface DatabaseConnectionManager {
  /**
   * Connect to the database
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the database
   */
  disconnect(): Promise<void>;

  /**
   * Check connection health
   */
  healthCheck(): Promise<boolean>;

  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean;
    driver: string;
    database?: string;
  };
}

/**
 * Migration runner interface
 */
export interface MigrationRunner {
  /**
   * Run pending migrations
   */
  migrate(): Promise<void>;

  /**
   * Rollback the last migration
   */
  rollback(): Promise<void>;

  /**
   * Get migration status
   */
  status(): Promise<Array<{
    name: string;
    executed: boolean;
    executedAt?: Date;
  }>>;
}

// Blob declarations
export const databaseConfig = createBlob<DatabaseConfig>('databaseConfig', {
  name: 'Database Configuration',
  description: 'Configuration for the database connection'
});

export const databaseClient = createBlob<DatabaseClient>('databaseClient', {
  name: 'Database Client',
  description: 'Drizzle ORM database client instance'
});

export const databaseConnectionManager = createBlob<DatabaseConnectionManager>('databaseConnectionManager', {
  name: 'Database Connection Manager',
  description: 'Manages database connection lifecycle'
});

export const migrationRunner = createBlob<MigrationRunner>('migrationRunner', {
  name: 'Migration Runner',
  description: 'Handles database migrations'
});

