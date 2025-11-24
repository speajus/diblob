import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { z } from 'zod';
import { loadNodeConfig } from '../src/node.js';

interface NodeAppConfig {
  port: number;
  host: string;
  flag: boolean;
}

	const NodeAppConfigSchema = z.object({
	  port: z.number().int(),
	  host: z.string(),
	  flag: z.boolean(),
	});

describe('loadNodeConfig', () => {
	  test('merges defaults, file config, env, and CLI with correct precedence', () => {
	    const tmpDir = mkdtempSync(join(tmpdir(), 'diblob-config-node-test-'));
	    try {
	      const filePath = join(tmpDir, 'config.json');
	      writeFileSync(filePath, JSON.stringify({ port: 81, host: 'file-host' }), 'utf8');

	      const env = {
	        APP_PORT: '82',
	        APP_FLAG: 'true',
	      };

	      const cliArgs = ['--app-port=83'];

	      const config = loadNodeConfig<NodeAppConfig>({
	        schema: NodeAppConfigSchema,
	        // defaults < fileConfig < env < CLI
	        defaults: { port: 80, host: 'defaults', flag: false },
	        file: filePath,
	        env,
	        envPrefix: 'APP_',
	        cliPrefix: 'app-',
	        cliArgs,
	      });

	      assert.equal(config.port, 83);
	      assert.equal(config.host, 'file-host');
	      assert.equal(config.flag, true);
	    } finally {
	      rmSync(tmpDir, { recursive: true, force: true });
	    }
	  });

  test('respects explicit environment when computing defaults', () => {
    interface EnvAwareConfig {
      label: string;
    }

	    const EnvAwareSchema = z.object({
	      label: z.string(),
	    });

    const config = loadNodeConfig<EnvAwareConfig>({
      schema: EnvAwareSchema,
      environment: 'test',
      defaults: (env) => ({ label: `env-${env}` }),
    });

    assert.equal(config.label, 'env-test');
  });
});
