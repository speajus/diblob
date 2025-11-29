import type { ConfigSchema } from '@speajus/diblob-config';
import { z } from 'zod';
import type { TelemetryConfig } from './blobs.js';

export const TelemetryConfigSchema = z
	.object({
		serviceName: z
			.string()
			.default('example')
			.describe('Logical service name used in telemetry metadata. Default: "example".'),
		serviceVersion: z
			.string()
			.optional()
			.describe('Optional service version reported in telemetry metadata.'),
		deploymentEnvironment: z
			.string()
			.optional()
			.describe('Optional deployment environment (for example: development, staging, production).'),
		exporter: z
			.enum(['console', 'otlp-http', 'none'])
			.default('console')
			.describe('Telemetry exporter type: "console", "otlp-http", or "none". Default: "console".'),
		exporterEndpoint: z
			.url()
			.optional()
			.describe('OTLP HTTP endpoint URL when exporter is "otlp-http".'),
		traceSampleRatio: z
			.number()
			.min(0)
			.max(1)
			.default(1)
			.describe('Trace sampling ratio between 0 and 1. Default: 1 (sample all traces).'),
		enableTraces: z
			.boolean()
			.default(true)
			.describe('Enable trace collection. Default: true.'),
		enableMetrics: z
			.boolean()
			.default(true)
			.describe('Enable metric collection. Default: true.'),
		enablePaths: z
			.boolean()
			.default(true)
			.describe('Enable path-related telemetry (reserved for future use). Default: true.'),
	 }) satisfies ConfigSchema<TelemetryConfig>;
