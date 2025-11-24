import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createBlob, createContainer } from '@speajus/diblob';
import { z } from 'zod';
import {
	  type LoadConfigOptions,
	  loadConfig,
	  registerConfigBlob,
	  registerStaticConfigBlob,
	} from '../src/index.js';

interface AppConfig {
  port: number;
  host: string;
}

	const AppConfigSchema = z.object({
	  port: z.number().int(),
	  host: z.string(),
	});

function createOptions(overrides: Partial<LoadConfigOptions<AppConfig>> = {}): LoadConfigOptions<AppConfig> {
  return {
    schema: AppConfigSchema,
    envPrefix: 'APP_',
    environment: 'test',
    ...overrides,
  };
}

describe('loadConfig', () => {
  test('loads configuration from env with prefix and merges with defaults', () => {
    const env = {
      APP_PORT: '3000',
      APP_HOST: '127.0.0.1',
    };

    const config = loadConfig(
      createOptions({
        env,
        defaults: { port: 80, host: '0.0.0.0' },
      }),
    );

    assert.equal(config.port, 3000);
    assert.equal(config.host, '127.0.0.1');
  });

  test('CLI switches override env and defaults when prefix matches', () => {
    const env = {
      APP_PORT: '4000',
      APP_HOST: 'env-host',
    };

    const config = loadConfig(
      createOptions({
        env,
        defaults: { port: 80, host: '0.0.0.0' },
        cliPrefix: 'app-',
        cliArgs: ['--app-port=5000'],
      }),
    );

    assert.equal(config.port, 5000);
    assert.equal(config.host, 'env-host');
  });
});

describe('registration helpers', () => {
  test('registerConfigBlob registers a singleton config blob', async () => {
    const container = createContainer();
    const appConfigBlob = createBlob<AppConfig>('appConfig');

    registerConfigBlob(container, appConfigBlob, createOptions({
      env: { APP_PORT: '1234', APP_HOST: 'localhost' },
    }));

    const first = await container.resolve(appConfigBlob);
    const second = await container.resolve(appConfigBlob);

    assert.equal(first.port, 1234);
    assert.equal(first.host, 'localhost');
    // Singleton semantics: same reference
    assert.strictEqual(first, second);
  });

  test('registerStaticConfigBlob registers a fixed config object', async () => {
    const container = createContainer();
    const appConfigBlob = createBlob<AppConfig>('staticConfig');

    const staticConfig: AppConfig = { port: 0, host: '127.0.0.1' };

    registerStaticConfigBlob(container, appConfigBlob, staticConfig);

    const resolved = await container.resolve(appConfigBlob);

    assert.strictEqual(resolved, staticConfig);
  });
});
