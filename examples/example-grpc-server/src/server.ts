/**
 * Example gRPC server using diblob-connect and diblob-drizzle
 * 
 * This example demonstrates:
 * - Setting up a gRPC server with diblob-connect
 * - Integrating a database with diblob-drizzle
 * - Using dependency injection for services
 * - Implementing gRPC service handlers
 */

import { createContainer } from '@speajus/diblob';
import { registerGrpcBlobs, grpcServer } from '@speajus/diblob-connect';
import { registerLoggerBlobs } from '@speajus/diblob-logger';
import { registerDrizzleBlobs, databaseClient } from '@speajus/diblob-drizzle';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

import { registerUserService } from './register.js';
import * as schema from './db/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_DB_PATH = join(__dirname, '../data/app.db');
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;

async function main() {
  console.log('🚀 Starting gRPC server with diblob...\n');

  // Create diblob container
  const container = createContainer();

	// Register logger blobs first so server logging goes through Winston
	registerLoggerBlobs(container, {
		level: 'info',
		prettyPrint: true,
		defaultMeta: { service: 'example-grpc-server' },
	});

	// Register gRPC blobs
	console.log('📦 Registering gRPC blobs...');
	registerGrpcBlobs(container, {
	  	host: '0.0.0.0',
	  	port: 50051
	  });

  // Register Drizzle blobs
  console.log('📦 Registering Drizzle blobs...');
  registerDrizzleBlobs(container, {
    driver: 'better-sqlite3',
    connection: DB_PATH,
    logging: true
  });

  // Initialize database
  console.log('💾 Initializing database...');
  if (DB_PATH !== ':memory:') {
    mkdirSync(dirname(DB_PATH), { recursive: true });
  }
  const sqlite = new Database(DB_PATH);
  const db = drizzle(sqlite, { schema });
  
  // Initialize the database client
  await databaseClient.initialize(db);

  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    )
  `);

  // Register user service
  console.log('📦 Registering user service...');
  registerUserService(container);
  // Start the server by resolving the server blob (lifecycle will call start)
  await container.resolve(grpcServer);


	  // Handle graceful shutdown
	  process.on('SIGINT', async () => {
	    console.log('\n\n🛑 Shutting down gracefully...');
	    await grpcServer.stop();
	    await databaseClient.close();
	    sqlite.close();
	    console.log('✅ Server stopped');
	    process.exit(0);
	  });
}

main().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

