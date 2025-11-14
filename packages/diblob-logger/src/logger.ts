/**
 * Winston logger factory.
 */

import winston from 'winston';
import type { Logger, LoggerConfig } from './blobs.js';

/**
 * Create a Winston logger from the provided configuration.
 */
export function createWinstonLogger(config: LoggerConfig): Logger {
  const { level = 'info', defaultMeta, prettyPrint = true } = config;

  const logger = winston.createLogger({
    level,
    defaultMeta,
    format: prettyPrint
      ? winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, ...meta }) => {
            const metaPart = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${level}]: ${message}${metaPart}`;
          }),
        )
      : winston.format.json(),
    transports: [new winston.transports.Console()],
  });

  // Adapt Winston's Logger to our minimal Logger interface.
  return {
    info(message: string, meta?: Record<string, unknown>) {
      logger.info(message, meta);
    },
    warn(message: string, meta?: Record<string, unknown>) {
      logger.warn(message, meta);
    },
    error(message: string, meta?: Record<string, unknown>) {
      logger.error(message, meta);
    },
    debug(message: string, meta?: Record<string, unknown>) {
      logger.debug(message, meta);
    },
  };
}

