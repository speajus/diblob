import type { ConfigSchema } from '@speajus/diblob-config';
import { z } from 'zod';
import type { LoggerConfig } from './blobs.js';

export const LoggerConfigSchema = z
  .object({
    level: z
      .string()
      .default('info')
      .describe('Minimum log level (Winston-compatible). Default: "info".'),
    defaultMeta: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Default metadata added to every log entry.'),
    prettyPrint: z
      .boolean()
      .default(true)
      .describe('Whether to pretty-print logs for human-readable output. Default: true.'),
  }) satisfies ConfigSchema<LoggerConfig>;

