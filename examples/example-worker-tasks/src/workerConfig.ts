import type { Container } from '@speajus/diblob';
import { createBlob } from '@speajus/diblob';
import { registerStaticConfigBlob } from '@speajus/diblob-config';

export type WorkerTelemetryExporter = 'console' | 'otlp-http' | 'none';

export type WorkerConfig = {
	logLevel: string;
	logPretty: boolean;
	deploymentEnvironment: string;
	serviceVersion?: string;
	telemetryExporter: WorkerTelemetryExporter;
	telemetryEndpoint?: string;
	telemetrySampleRatio: number;
	telemetryTraces: boolean;
	telemetryMetrics: boolean;
};

export const workerConfig = createBlob<WorkerConfig>('workerConfig');

export function registerWorkerConfig(container: Container): void {
	const config: WorkerConfig = {
		logLevel: process.env.EXAMPLE_WORKER_TASKS_LOG_LEVEL ?? 'info',
		logPretty: process.env.EXAMPLE_WORKER_TASKS_LOG_PRETTY !== 'false',
		deploymentEnvironment: process.env.NODE_ENV ?? 'development',
		serviceVersion: process.env.EXAMPLE_WORKER_TASKS_SERVICE_VERSION,
		telemetryExporter:
			(process.env.EXAMPLE_WORKER_TASKS_TELEMETRY_EXPORTER as WorkerTelemetryExporter) ??
			'console',
		telemetryEndpoint: process.env.EXAMPLE_WORKER_TASKS_TELEMETRY_ENDPOINT,
		telemetrySampleRatio: Number(
			process.env.EXAMPLE_WORKER_TASKS_TELEMETRY_SAMPLE_RATIO ?? '1',
		),
		telemetryTraces:
			process.env.EXAMPLE_WORKER_TASKS_TELEMETRY_TRACES !== 'false',
		telemetryMetrics:
			process.env.EXAMPLE_WORKER_TASKS_TELEMETRY_METRICS !== 'false',
	};

	registerStaticConfigBlob(container, workerConfig, config);
}

