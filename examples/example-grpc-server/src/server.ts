/**
 * Example gRPC server using diblob-connect with a Drizzle ORM-backed database
 *
 * This example demonstrates:
 * - Setting up a gRPC server with diblob-connect
 * - Integrating a database using Drizzle ORM
 * - Using dependency injection for services
 * - Implementing gRPC service handlers
 */

import {  createContainer } from '@speajus/diblob';
import { grpcServer, registerGrpcBlobs } from '@speajus/diblob-connect';
import { registerLoggerBlobs } from '@speajus/diblob-logger';
import {
	registerVisualizerBlobs,
	visualizerServer,
} from '@speajus/diblob-visualizer/server';
import { registerDrizzleBlobs, registerUserService } from './register.js';


async function main(container = createContainer()) {
  console.log('🚀 Starting gRPC server with diblob...\n');

	// Register logger blobs first so server logging goes through Winston
	registerLoggerBlobs(container, {
		level: 'info',
		prettyPrint: true,
		defaultMeta: { service: 'example-grpc-server' },
	});

	// Register gRPC blobs
	registerGrpcBlobs(container, {
		host: process.env.HOST || '0.0.0.0',
		port: process.env.PORT ? Number(process.env.PORT) : 50051,
	});

	registerDrizzleBlobs(container);
	
	registerUserService(container);

	// Register visualizer server blobs so the container graph is exposed via HTTP
	registerVisualizerBlobs(container, {
		host: process.env.VISUALIZER_HOST || '0.0.0.0',
		port: process.env.VISUALIZER_PORT ? Number(process.env.VISUALIZER_PORT) : 3001,
	});

	// Start the servers by resolving their blobs (lifecycle will call start)
	await Promise.all([
		container.resolve(grpcServer),
		container.resolve(visualizerServer),
	]);

	console.log(`gRPC server running at ${grpcServer.getAddress()}`);
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

