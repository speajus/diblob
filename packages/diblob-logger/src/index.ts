/**
 * @speajus/diblob-logger
 *
 * Winston-based logger integration for diblob dependency injection containers.
 */

	export type { Logger, LoggerConfig } from './blobs.js';
	export { logger, loggerConfig, loggerTransports } from './blobs.js';
	export { LoggerConfigSchema } from './config.js';
export { createWinstonLogger } from './logger.js';
export { registerLoggerBlobs } from './register.js';

