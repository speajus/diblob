/**
 * Example gRPC server using diblob-connect and diblob-drizzle
 * 
 * This example demonstrates:
 * - Setting up a gRPC server with diblob-connect
 * - Integrating a database with diblob-drizzle
 * - Using dependency injection for services
 * - Implementing gRPC service handlers
 */

	import {  createContainer } from '@speajus/diblob';
import { grpcServer, registerGrpcBlobs } from '@speajus/diblob-connect';
import { registerLoggerBlobs } from '@speajus/diblob-logger';
import { registerUserService } from './register.js';
import { registerDrizzleBlobs, sqlite } from './drizzle.js';


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
	registerGrpcBlobs(container, {
	  	host: '0.0.0.0',
	  	port: 50051
	  });
      
	  registerDrizzleBlobs(container);
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

	  // Handle graceful shutdown via container.dispose()
	  process.on('SIGINT', async () => {
	    console.log('\n\n🛑 Shutting down gracefully...');
	    await container.dispose();
	    console.log('✅ Server stopped');
	    process.exit(0);
	  });
}

main().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

