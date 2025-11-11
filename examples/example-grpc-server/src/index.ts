/**
 * Example gRPC server using diblob-grpc and diblob-drizzle
 * 
 * This example demonstrates:
 * - Setting up a gRPC server with diblob-grpc
 * - Integrating a database with diblob-drizzle
 * - Using dependency injection for services
 * - Implementing gRPC service handlers
 */

import { createContainer } from '@speajus/diblob';
import { registerGrpcBlobs, grpcServer } from '@speajus/diblob-grpc';
import { registerDrizzleBlobs, databaseClient } from '@speajus/diblob-drizzle';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

import { userService, UserServiceImpl } from './services/user-service.js';
import { UserGrpcService } from './grpc/user-grpc-service.js';
import * as schema from './db/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    connection: './data/app.db',
    logging: true
  });

  // Initialize database
  console.log('💾 Initializing database...');
  mkdirSync(join(__dirname, '../data'), { recursive: true });
  const sqlite = new Database(join(__dirname, '../data/app.db'));
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

  // Load proto file
  console.log('📄 Loading proto definitions...');
  const PROTO_PATH = join(__dirname, '../proto/user.proto');
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;

  // Create gRPC service implementation
  console.log('🔧 Setting up gRPC service handlers...');
  const userGrpcService = new UserGrpcService(userService);

  // Add service to gRPC server
  grpcServer.addService(protoDescriptor.user.UserService.service, {
    getUser: userGrpcService.getUser,
    createUser: userGrpcService.createUser,
    listUsers: userGrpcService.listUsers,
    updateUser: userGrpcService.updateUser,
    deleteUser: userGrpcService.deleteUser
  });

  // Start the server
  console.log('🌐 Starting gRPC server...');
  await grpcServer.start();

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

