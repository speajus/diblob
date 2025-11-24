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
import { registerTelemetryBlobs, registerTelemetryLoggerBlobs, telemetryContext } from '@speajus/diblob-telemetry';
import {
	registerVisualizerBlobs,
	visualizerServer,
} from '@speajus/diblob-visualizer/server';
import { registerDrizzleBlobs, registerUserService } from './register.js';


async function main(container = createContainer()) {
  console.log('🚀 Starting gRPC server with diblob...\n');

    // Register logger blobs via telemetry helper so Loki wiring lives in telemetry
    const lokiHost = process.env.LOGGER_LOKI_HOST;
    registerTelemetryLoggerBlobs(
      container,
      {
        level: process.env.LOG_LEVEL ?? 'info',
        prettyPrint: process.env.LOG_PRETTY !== 'false',
        defaultMeta: { service: 'example-grpc-server' },
      },
      lokiHost
        ? {
            host: lokiHost,
            labels: {
              service: 'example-grpc-server',
              env: process.env.DEPLOYMENT_ENVIRONMENT ?? 'development',
            },
          }
        : undefined,
    );

    // Register telemetry (tracing + metrics). Defaults to console exporter unless
    // TELEMETRY_EXPORTER=otlp-http is provided (e.g., Jaeger, Grafana Alloy).
    const traceSampleRatio = Number(process.env.TELEMETRY_SAMPLE_RATIO ?? '1');
    registerTelemetryBlobs(container, {
      serviceName: 'example-grpc-server',
      serviceVersion: process.env.SERVICE_VERSION,
      deploymentEnvironment: process.env.DEPLOYMENT_ENVIRONMENT,
      exporter:
        (process.env.TELEMETRY_EXPORTER as 'otlp-http' | 'console' | 'none' | undefined)
          ?? 'console',
      exporterEndpoint: process.env.TELEMETRY_ENDPOINT,
      traceSampleRatio: Number.isFinite(traceSampleRatio) ? traceSampleRatio : 1,
      enableTraces: process.env.TELEMETRY_TRACES !== 'false',
      enableMetrics: process.env.TELEMETRY_METRICS !== 'false',
    });

    // Ensure telemetry context is initialized early so spans/meters are ready
    await container.resolve(telemetryContext);

		// Register gRPC blobs
    registerGrpcBlobs(container, {
      host: process.env.HOST || '0.0.0.0',
      port: process.env.PORT ? Number(process.env.PORT) : 50051,
    });

    registerDrizzleBlobs(container);
    
    // Ensure service is registered before starting servers to avoid 404/UNIMPLEMENTED.
    await registerUserService(container);

	// Register visualizer server blobs so the container graph is exposed via HTTP
	registerVisualizerBlobs(container, {
		host: process.env.VISUALIZER_HOST || '0.0.0.0',
			port: process.env.VISUALIZER_PORT ? Number(process.env.VISUALIZER_PORT) : 3002,
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

