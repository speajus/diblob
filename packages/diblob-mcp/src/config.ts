import type { ConfigSchema } from '@speajus/diblob-config';
import { z } from 'zod';
import type { McpServerConfig } from './blobs.js';

export const McpServerConfigSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .describe('Name of the MCP server.'),
    version: z
      .string()
      .min(1)
      .describe('Version of the MCP server.'),
    description: z
      .string()
      .optional()
      .describe('Optional human-readable description of the MCP server.'),
  }) satisfies ConfigSchema<McpServerConfig>;

