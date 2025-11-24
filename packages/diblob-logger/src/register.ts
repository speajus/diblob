/**
 * Registration function for logger blobs.
 */

import type { Container } from '@speajus/diblob';
import winston from 'winston';
import { type LoggerConfig, logger, loggerConfig, loggerTransports } from './blobs.js';
import { createWinstonLogger } from './logger.js';

const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  level: 'info',
  prettyPrint: true,
};

/**
 * Register logger-related blobs with the provided container.
 *
 * This follows the diblob pattern of a registration function that accepts a
 * container and optional configuration.
 */
export function registerLoggerBlobs(
  container: Container,
  config: Partial<LoggerConfig> = {},
): void {
  const finalConfig: LoggerConfig = { ...DEFAULT_LOGGER_CONFIG, ...config };

  // Configuration blob
  container.register(loggerConfig, () => finalConfig);

  // Transports list blob - initialized with console transport
  container.register(loggerTransports, () => [new winston.transports.Console()]);

  // Logger blob backed by Winston
  container.register(
    logger,
    createWinstonLogger,
    loggerConfig,
    loggerTransports,
  );
}

