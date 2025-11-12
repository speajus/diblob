/**
 * @speajus/diblob-logger
 *
 * Winston-based logger integration for diblob dependency injection containers.
 */

export type { Logger, LoggerConfig } from './blobs.js';
export { logger, loggerConfig } from './blobs.js';

export { registerLoggerBlobs } from './register.js';
export { createWinstonLogger } from './logger.js';

