import { createContainer } from '@speajus/diblob';
import { logger } from '@speajus/diblob-logger';
import {
	registerTelemetryBlobs,
	registerTelemetryLoggerBlobs,
	telemetryContext,
} from '@speajus/diblob-telemetry';
import { processExampleJob, registerWorkerBlobs } from './register';
import { registerWorkerConfig, workerConfig } from './workerConfig';

async function main() {
	const container = createContainer();

	// Register and resolve worker configuration.
	registerWorkerConfig(container);
	const config = await container.resolve(workerConfig);

	// Configure logger and telemetry in the same style as example-grpc-server.
	registerTelemetryLoggerBlobs(container, {
		level: config.logLevel,
		prettyPrint: config.logPretty,
		defaultMeta: { service: 'example-worker-tasks' },
	});

	registerTelemetryBlobs(container, {
		serviceName: 'example-worker-tasks',
		serviceVersion: config.serviceVersion,
		deploymentEnvironment: config.deploymentEnvironment,
		exporter: config.telemetryExporter,
		exporterEndpoint: config.telemetryEndpoint,
		traceSampleRatio: config.telemetrySampleRatio,
		enableTraces: config.telemetryTraces,
		enableMetrics: config.telemetryMetrics,
	});

	// Ensure telemetry context is initialized before starting the loop.
	await container.resolve(telemetryContext);

	await registerWorkerBlobs(container);

	const rootLogger = await container.resolve(logger);
	rootLogger.info('Starting example-worker-tasks loop');

	// Simple timer-based loop to simulate jobs; real implementations would
	// subscribe to a queue or scheduler.
	setInterval(async () => {
			const jobContainer = createContainer(container);
		try {
			const handler = await jobContainer.resolve(processExampleJob);
			await handler();
		} catch (err) {
			rootLogger.error({ err }, 'Job failed');
		} finally {
			await jobContainer.dispose();
		}
	}, 5_000);
}

void main().catch((err) => {
	// eslint-disable-next-line no-console
	console.error('example-worker-tasks failed to start', err);
	process.exit(1);
});

