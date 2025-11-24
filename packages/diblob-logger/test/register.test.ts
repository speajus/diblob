import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createContainer } from '@speajus/diblob';
import {
  createWinstonLogger,
  type Logger,
  type LoggerConfig,
  logger,
  loggerConfig,
  registerLoggerBlobs,
} from '../src/index.js';

// Basic behavior test for createWinstonLogger. We do not peek into Winston's
// internal logger, but we ensure the returned object matches the Logger
// interface and that calling its methods does not throw.
test('createWinstonLogger returns a logger implementing the Logger interface', () => {
  const config: LoggerConfig = {
    level: 'debug',
    defaultMeta: { service: 'test-service' },
    prettyPrint: false,
  };

  const log: Logger = createWinstonLogger(config);

  assert.equal(typeof log.info, 'function');
  assert.equal(typeof log.warn, 'function');
  assert.equal(typeof log.error, 'function');
  assert.equal(typeof log.debug, 'function');

  // Ensure the methods are callable without throwing.
  log.info('info message');
  log.warn('warn message', { foo: 'bar' });
  log.error('error message');
  log.debug('debug message', { debug: true });
});

// Ensure registerLoggerBlobs wires up the config blob with default values
// and registers the logger blob in the container.
test('registerLoggerBlobs registers default config and logger blob', async () => {
  const container = createContainer();

  registerLoggerBlobs(container);

  const config = await container.resolve(loggerConfig);

  // Defaults are defined in DEFAULT_LOGGER_CONFIG.
  assert.equal(config.level, 'info');
  assert.equal(config.prettyPrint, true);
  assert.equal(config.defaultMeta, undefined);

  const log = await container.resolve(logger);

  assert.equal(typeof log.info, 'function');
  assert.equal(typeof log.error, 'function');

  // Calls should not throw, even with default configuration.
  log.info('hello from default logger');
  log.error('something went wrong', { code: 'E_TEST' });
});

// Ensure that user-provided configuration is merged with defaults and that
// the same configuration instance is returned from the config blob.
test('registerLoggerBlobs merges provided config with defaults', async () => {
  const container = createContainer();

  registerLoggerBlobs(container, {
    level: 'warn',
    defaultMeta: { env: 'test' },
    prettyPrint: false,
  });

  const config = await container.resolve(loggerConfig);

  // Provided values should override defaults.
  assert.equal(config.level, 'warn');
  assert.equal(config.prettyPrint, false);
  assert.deepEqual(config.defaultMeta, { env: 'test' });

  const log = await container.resolve(logger);

  log.warn('warn with merged config', { scope: 'merge-test' });
});
