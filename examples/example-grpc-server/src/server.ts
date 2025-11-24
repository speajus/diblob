/**
 * Example gRPC server using diblob-connect with a Drizzle ORM-backed database
 *
 * This example demonstrates:
 * - Setting up a gRPC server with diblob-connect
 * - Integrating a database using Drizzle ORM
 * - Using dependency injection for services
 * - Implementing gRPC service handlers
 */

import { createContainer } from '@speajus/diblob';
	import { printNodeConfigHelpIfRequested } from '@speajus/diblob-config/node';
import { grpcServer, registerGrpcBlobs } from '@speajus/diblob-connect';
import {
	registerTelemetryBlobs,
	registerTelemetryLoggerBlobs,
	telemetryContext,
} from '@speajus/diblob-telemetry';
import {
	registerVisualizerBlobs,
	visualizerServer,
} from '@speajus/diblob-visualizer/server';
	import {
		EXAMPLE_GRPC_CLI_PREFIX,
		EXAMPLE_GRPC_ENV_PREFIX,
		ExampleGrpcServerConfigSchema,
		exampleGrpcServerConfig,
		registerExampleGrpcServerConfig,
	} from './config.js';
import { registerDrizzleBlobs, registerUserService } from './register.js';

async function main(container = createContainer()) {
		if (
			printNodeConfigHelpIfRequested({
				schema: ExampleGrpcServerConfigSchema,
				envPrefix: EXAMPLE_GRPC_ENV_PREFIX,
				cliPrefix: EXAMPLE_GRPC_CLI_PREFIX,
				programName: 'example-grpc-server',
			})
		) {
			return;
		}

		console.log('🚀 Starting gRPC server with diblob...\n');

	// Register typed configuration for the example server
	registerExampleGrpcServerConfig(container);
	const config = await container.resolve(exampleGrpcServerConfig);

	// Register logger blobs via telemetry helper so Loki wiring lives in telemetry
	const lokiOptions = config.loggerLokiHost
		? {
				host: config.loggerLokiHost,
				labels: {
						service: 'example-grpc-server',
						env: config.deploymentEnvironment,
					},
			}
		: undefined;

	registerTelemetryLoggerBlobs(
		container,
		{
			level: config.logLevel,
			prettyPrint: config.logPretty,
			defaultMeta: { service: 'example-grpc-server' },
		},
		lokiOptions,
	);

	// Register telemetry (tracing + metrics) using typed configuration.
	registerTelemetryBlobs(container, {
		serviceName: 'example-grpc-server',
		serviceVersion: config.serviceVersion,
		deploymentEnvironment: config.deploymentEnvironment,
		// TELEMETRY_EXPORTER=otlp-http|console|none
		exporter: config.telemetryExporter,
		exporterEndpoint: config.telemetryEndpoint,
		traceSampleRatio: config.telemetrySampleRatio,
		enableTraces: config.telemetryTraces,
		enableMetrics: config.telemetryMetrics,
	});

	// Ensure telemetry context is initialized early so spans/meters are ready
	await container.resolve(telemetryContext);

	// Register gRPC blobs using typed configuration
	registerGrpcBlobs(container, {
		host: config.host,
		port: config.port,
	});

	registerDrizzleBlobs(container, config.dbPath);

	// Ensure service is registered before starting servers to avoid 404/UNIMPLEMENTED.
	await registerUserService(container);

	// Register visualizer server blobs so the container graph is exposed via HTTP
	registerVisualizerBlobs(container, {
		host: config.visualizerHost,
		port: config.visualizerPort,
	});

	// Start the servers by resolving their blobs (lifecycle will call start)
	const [serverInstance] = await Promise.all([
		container.resolve(grpcServer),
		container.resolve(visualizerServer),
	]);

	console.log(
		`gRPC server running at ${
			serverInstance.getAddress() ?? `${config.host}:${config.port}`
		}`,
	);
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

