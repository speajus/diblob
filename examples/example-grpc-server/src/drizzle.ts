/**
 * Example gRPC server using diblob-connect with a Drizzle ORM-backed database
 *
 * This module demonstrates:
 * - Setting up a gRPC server with diblob-connect
 * - Integrating a database using Drizzle ORM
 * - Using dependency injection for services
 * - Implementing gRPC service handlers
 */

import type Database from 'better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from './db/schema.js';
import {createBlob } from '@speajus/diblob';


export const sqlite = createBlob<InstanceType<typeof Database>>('sqlite', {
    name: 'SQLite Database',
    description: 'SQLite database connection'
});

export type Schema = typeof schema;

export type DrizzleType = BetterSQLite3Database<Schema>;

export const database = createBlob<DrizzleType>('db', {
    name: 'Drizzle Database',
    description: 'Drizzle database connection'
});

