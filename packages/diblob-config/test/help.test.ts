import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { z } from 'zod';
import { buildConfigHelpText } from '../src/index.js';
import { printNodeConfigHelpIfRequested } from '../src/node.js';

describe('buildConfigHelpText', () => {
	test('includes key, env, flag, type, default, and description', () => {
		const Schema = z.object({
			port: z
				.number()
				.int()
				.describe('TCP port for the server.'),
			host: z
				.string()
				.describe('Hostname or IP address to bind.'),
		});

		const text = buildConfigHelpText<{ port: number; host: string }>({
			schema: Schema,
			envPrefix: 'APP_',
			cliPrefix: 'app-',
			defaults: { port: 3000, host: '127.0.0.1' },
			programName: 'example-app',
		});

		assert.match(text, /Usage: example-app \[options]/);
		assert.match(text, /port/);
		assert.match(text, /env: {2}APP_PORT/);
		assert.match(text, /flag: --app-port/);
		assert.match(text, /type: number/);
		assert.match(text, /default: 3000/);
		assert.match(text, /description: TCP port for the server\./);
		assert.match(text, /host/);
		assert.match(text, /APP_HOST/);
	});
});

describe('printNodeConfigHelpIfRequested', () => {
	test('prints help text and returns true when help flag is present', () => {
		const Schema = z.object({
			foo: z.string().describe('Foo value.'),
		});

		let output = '';
		const printed = printNodeConfigHelpIfRequested<{ foo: string }>({
			schema: Schema,
			cliPrefix: 'app-',
			programName: 'test-app',
			cliArgs: ['--help'],
			out: (text) => {
				output = text;
			},
		});

		assert.equal(printed, true);
		assert.match(output, /Usage: test-app \[options]/);
		assert.match(output, /foo/);
	});

	test('returns false and does not print when help flag is absent', () => {
		const Schema = z.object({
			bar: z.string(),
		});

		let output = '';
		const printed = printNodeConfigHelpIfRequested<{ bar: string }>({
			schema: Schema,
			cliPrefix: 'app-',
			programName: 'test-app',
			cliArgs: ['--app-bar=1'],
			out: (text) => {
				output = text;
			},
		});

		assert.equal(printed, false);
		assert.equal(output, '');
	});
});
