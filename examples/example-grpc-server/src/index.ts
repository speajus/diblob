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
import { registerGrpcBlobs, grpcServer, grpcServiceRegistry } from '@speajus/diblob-connect';
import { registerDrizzleBlobs, databaseClient } from '@speajus/diblob-drizzle';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

import { userService, UserServiceImpl } from './services/user-service.js';
import { UserGrpcServiceTyped } from './grpc/user-grpc-service-typed.js';
// Connect-ES / Protobuf-ES generated service descriptor and message types
// (from @bufbuild/protoc-gen-es, user_pb.ts)
import {
  UserService,
  type GetUserRequest,
  type CreateUserRequest,
  type ListUsersRequest,
  type UpdateUserRequest,
  type DeleteUserRequest,
} from './generated/user_pb.js';
import * as schema from './db/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_DB_PATH = join(__dirname, '../data/app.db');
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;

async function main() {
  console.log('🚀 Starting gRPC server with diblob...\n');

  // Create diblob container
  const container = createContainer();

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
  container.register(userService, UserServiceImpl, databaseClient);

  // Create Connect-based service implementation
  console.log('🔧 Setting up Connect service handlers...');
  const userGrpcService = new UserGrpcServiceTyped(userService);

	  // Register typed service with the gRPC service registry.
	  // The service descriptor comes from Connect-ES code generation.
	  grpcServiceRegistry.registerService(UserService, {
	    getUser: (request: GetUserRequest) => userGrpcService.getUser(request),
	    createUser: (request: CreateUserRequest) => userGrpcService.createUser(request),
	    listUsers: (request: ListUsersRequest) => userGrpcService.listUsers(request),
	    updateUser: (request: UpdateUserRequest) => userGrpcService.updateUser(request),
	    deleteUser: (request: DeleteUserRequest) => userGrpcService.deleteUser(request),
	  } as any);

  // Start the server by resolving the server blob (lifecycle will call start)
  console.log('🌐 Starting gRPC server (Connect)...');
  await container.resolve(grpcServer);

  console.log(`\n✅ gRPC server is running on ${grpcServer.getAddress()}`);
  console.log('\nAvailable services:');
  console.log('  - user.UserService');
  console.log('\nPress Ctrl+C to stop the server\n');

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

