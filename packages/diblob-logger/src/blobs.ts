/**
 * Blob and interface definitions for a Winston-based logger.
 *
 * This package exposes a Logger interface and corresponding blobs so
 * applications can configure logging via diblob.
 */

import { createBlob } from '@speajus/diblob';

/**
 * Configuration for the application logger.
 */
export interface LoggerConfig {
  /** Minimum log level (Winston-compatible). Defaults to "info". */
  level?: string;

  /** Default metadata added to every log entry. */
  defaultMeta?: Record<string, unknown>;

  /** Whether to pretty-print logs for human-readable output. */
  prettyPrint?: boolean;
}

/**
 * Minimal logger interface, aligned with Winston's primary methods.
 */
export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

// Blob declarations
export const loggerConfig = createBlob<LoggerConfig>('loggerConfig', {
  name: 'Logger Configuration',
  description: 'Configuration for the application logger (Winston-based)',
});

export const logger = createBlob<Logger>('logger', {
  name: 'Logger',
  description: 'Winston-based application logger',
});

