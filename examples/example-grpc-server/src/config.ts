import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Container } from '@speajus/diblob';
import { createBlob } from '@speajus/diblob';
import { type EnvironmentName, registerStaticConfigBlob } from '@speajus/diblob-config';
import { loadNodeConfig } from '@speajus/diblob-config/node';
import { z } from 'zod';

export type TelemetryExporter = 'console' | 'otlp-http' | 'none';
export const ExampleGrpcServerConfigSchema = z.object({
	host: z
		.string()
		.min(1)
		.describe('Host interface for the gRPC/Connect server.'),
	port: z
		.number()
		.int()
		.positive()
		.describe('TCP port for the gRPC/Connect server.'),
	visualizerHost: z
		.string()
		.min(1)
		.describe('Host interface for the diblob visualizer HTTP server.'),
	visualizerPort: z
		.number()
		.int()
		.positive()
		.describe('TCP port for the diblob visualizer HTTP server.'),
	dbPath: z
		.string()
		.min(1)
		.describe('Path to the SQLite database file (use :memory: for in-memory).'),
	logLevel: z
		.string()
		.describe('Log level (e.g. debug, info, warn, error).')
		.default('info'),
	logPretty: z
		.boolean()
		.describe('Pretty-print logs to stdout.')
		.default(true),
	loggerLokiHost: z
		.string()
		.url()
		.describe('Optional Loki endpoint for structured logs.')
		.optional(),
	serviceVersion: z
		.string()
		.describe('Service version to attach to logs/telemetry.')
		.optional(),
	deploymentEnvironment: z
		.string()
		.describe('Deployment environment (e.g. development, staging, production).')
		.default('development'),
	telemetryExporter: z
		.enum(['console', 'otlp-http', 'none'])
		.describe('Telemetry exporter to use (console, otlp-http, or none).')
		.default('console'),
	telemetryEndpoint: z
		.string()
		.url()
		.describe('Endpoint for OTLP HTTP telemetry exporter (if enabled).')
		.optional(),
	telemetrySampleRatio: z
		.number()
		.positive()
		.describe('Sampling ratio for traces (1.0 = sample all).')
		.default(1),
	telemetryTraces: z
		.boolean()
		.describe('Enable tracing telemetry.')
		.default(true),
	telemetryMetrics: z
		.boolean()
		.describe('Enable metrics telemetry.')
		.default(true),
});

export type ExampleGrpcServerConfig = z.infer<typeof ExampleGrpcServerConfigSchema>;


export const exampleGrpcServerConfig = createBlob<ExampleGrpcServerConfig>(
  'exampleGrpcServerConfig',
);


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const EXAMPLE_GRPC_ENV_PREFIX = 'EXAMPLE_GRPC_SERVER_';
export const EXAMPLE_GRPC_CLI_PREFIX = 'grpc-';

export function exampleGrpcServerDefaults(
	environment: EnvironmentName,
): Partial<ExampleGrpcServerConfig> {
	const defaultDbPath = join(__dirname, '../data/app.db');
	return {
		host: '0.0.0.0',
		port: 50051,
		visualizerHost: '0.0.0.0',
		visualizerPort: 3002,
		dbPath: defaultDbPath,
		logLevel: 'info',
		logPretty: true,
		deploymentEnvironment: environment ?? 'development',
		telemetryExporter: 'console',
		telemetrySampleRatio: 1,
		telemetryTraces: true,
		telemetryMetrics: true,
	};
}

export function registerExampleGrpcServerConfig(container: Container): void {
	const config = loadNodeConfig<ExampleGrpcServerConfig>({
		schema: ExampleGrpcServerConfigSchema,
		defaults: exampleGrpcServerDefaults,
		envPrefix: EXAMPLE_GRPC_ENV_PREFIX,
		cliPrefix: EXAMPLE_GRPC_CLI_PREFIX,
		// Use process.env as-is; relevant variables (HOST, PORT, VISUALIZER_HOST,
		// VISUALIZER_PORT, DB_PATH, LOG_LEVEL, etc.) will be normalized to
		// camelCase keys.
	});

	registerStaticConfigBlob(container, exampleGrpcServerConfig, config);
}
