/**
 * In-memory logger implementation for testing.
 */

import type { LogRecord, TestLogger } from './blobs.js';

/**
 * Create an in-memory logger that stores all log records for testing.
 */
export function createInMemoryLogger(): TestLogger {
  const records: LogRecord[] = [];

  const logger: TestLogger = {
    info(message: string, meta?: Record<string, unknown>): void {
      records.push({
        level: 'info',
        message,
        meta,
        timestamp: Date.now(),
      });
    },

    warn(message: string, meta?: Record<string, unknown>): void {
      records.push({
        level: 'warn',
        message,
        meta,
        timestamp: Date.now(),
      });
    },

    error(message: string, meta?: Record<string, unknown>): void {
      records.push({
        level: 'error',
        message,
        meta,
        timestamp: Date.now(),
      });
    },

    debug(message: string, meta?: Record<string, unknown>): void {
      records.push({
        level: 'debug',
        message,
        meta,
        timestamp: Date.now(),
      });
    },

    getRecords(): LogRecord[] {
      return [...records]; // Return a copy to prevent external mutation
    },

    clear(): void {
      records.length = 0;
    },
  };

  return logger;
}
