
import {type Blob, createBlob } from '@speajus/diblob';
import type Database from 'better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from './db/schema.js';

export type SqliteDatabase = InstanceType<typeof Database>;

export const sqlite: Blob<SqliteDatabase> = createBlob<SqliteDatabase>('sqlite', {
    name: 'SQLite Database',
    description: 'SQLite database connection'
});


export type DrizzleType = BetterSQLite3Database<typeof schema>;

export const database = createBlob<DrizzleType>('db', {
    name: 'Drizzle Database',
    description: 'Drizzle database connection'
});

