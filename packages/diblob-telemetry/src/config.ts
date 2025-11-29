import type { ConfigSchema } from '@speajus/diblob-config';
import { z } from 'zod';
import type { TelemetryConfig } from './blobs.js';

export const TelemetryConfigSchema = z
	.object({
		serviceName: z.string().default('example'),
		serviceVersion: z.string().optional(),
		deploymentEnvironment: z.string().optional(),
		exporter: z.enum(['console', 'otlp-http', 'none']).default('console'),
		exporterEndpoint: z.string().url().optional(),
		traceSampleRatio: z.number().min(0).max(1).default(1),
		enableTraces: z.boolean().default(true),
		enableMetrics: z.boolean().default(true),
		enablePaths: z.boolean().default(true),
	 }) satisfies ConfigSchema<TelemetryConfig>;
