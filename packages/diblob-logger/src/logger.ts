/**
 * Winston logger factory.
 */

import winston from 'winston';
import LokiTransport from 'winston-loki';
import type { Logger, LoggerConfig } from './blobs.js';

/**
 * Create a Winston logger from the provided configuration.
 */
export function createWinstonLogger(config: LoggerConfig): Logger {
  const { level = 'info', defaultMeta, prettyPrint = true } = config;

  const baseFormat = prettyPrint
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaPart = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}]: ${message}${metaPart}`;
        }),
      )
    : winston.format.json();

  const transports: winston.transport[] = [
    new winston.transports.Console(),
  ];

  if (config.loki?.host) {
    transports.push(
      new LokiTransport({
        host: config.loki.host,
        labels: config.loki.labels,
        level: config.loki.level ?? level,
        batching: true,
        interval: config.loki.interval ?? 1000,
        json: config.loki.json ?? true,
      }),
    );
  }

  const logger = winston.createLogger({
    level,
    defaultMeta,
    format: baseFormat,
    transports,
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

