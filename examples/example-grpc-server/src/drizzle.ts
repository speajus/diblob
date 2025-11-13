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
import Database from 'better-sqlite3';
import { type BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './db/schema.js';
import { type Container, createBlob, Lifecycle } from '@speajus/diblob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_DB_PATH = join(__dirname, '../data/app.db');
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;

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



export function registerDrizzleBlobs(container: Container, dbPath: string = DB_PATH): void {
            // Initialize database
    console.log('💾 Initializing database...');
    if (DB_PATH !== ':memory:') {
            mkdirSync(dirname(DB_PATH), { recursive: true });
    }


    container.register(sqlite, Database, dbPath,{}, { 
        lifecycle: Lifecycle.Singleton,
        dispose: 'close',
    });

    container.register(database,  drizzle, sqlite, { schema });

}