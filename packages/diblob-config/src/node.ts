import { existsSync, readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import type { z } from 'zod';
import { buildConfigHelpText } from './help.js';
import { loadConfig } from './loader.js';
import type {
  ConfigSchema,
  EnvironmentName,
  LoadConfigOptions,
} from './types.js';

export interface NodeConfigOptions<TConfig> {
  /** Runtime schema used for validation and coercion. */
  schema: ConfigSchema<TConfig>;

  /** Optional prefix for environment variables, e.g. "APP_". */
  envPrefix?: string;

  /**
   * Default values applied before file/env/CLI. May be static or depend on the
   * resolved environment.
   */
  defaults?: LoadConfigOptions<TConfig>['defaults'];

  /**
   * Named environment, e.g. "development" or "production". Defaults to
   * `process.env.NODE_ENV ?? "development"`.
   */
  environment?: EnvironmentName;

  /**
   * Env record to read from. Defaults to `process.env`.
   */
  env?: Record<string, string | undefined>;

  /**
   * Optional JSON config file path to merge into the configuration.
   */
  file?: string;

  /**
   * CLI arguments (e.g. `process.argv.slice(2)`). If omitted, they will be
   * derived from `process.argv` when `cliPrefix` is provided.
   */
  cliArgs?: string[];

  /**
   * Prefix for CLI switches, e.g. "app-" to match `--app-port=3000`.
   */
  cliPrefix?: string;
}

export interface NodeConfigHelpOptions<TConfig> {
	schema: z.ZodObject<Record<string, z.ZodTypeAny>>;
	envPrefix?: string;
	cliPrefix?: string;
	defaults?: LoadConfigOptions<TConfig>['defaults'];
	environment?: EnvironmentName;
	programName?: string;
	cliArgs?: string[];
	helpFlag?: string;
	out?: (text: string) => void;
}

/**
 * Convenience wrapper around `loadConfig` for Node environments.
 *
 * This function wires in `process.env`, `process.argv`, and JSON file loading
 * from disk, then delegates to the environment-agnostic `loadConfig`.
 */
export function loadNodeConfig<TConfig>(options: NodeConfigOptions<TConfig>): TConfig {
  const environment: EnvironmentName =
    options.environment ?? ((process.env.NODE_ENV ?? 'development') as EnvironmentName);

  const env =
    options.env ?? (process.env as Record<string, string | undefined>);

  let fileConfig: unknown;
  if (options.file) {
    const filePath = resolvePath(options.file);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf8');
      if (content.trim().length > 0) {
        fileConfig = JSON.parse(content);
      }
    }
  }

  const cliArgs =
    options.cliPrefix && !options.cliArgs
      ? process.argv.slice(2)
      : options.cliArgs;

  return loadConfig<TConfig>({
    schema: options.schema,
    defaults: options.defaults,
    environment,
    envPrefix: options.envPrefix,
    env,
    fileConfig,
    cliPrefix: options.cliPrefix,
    cliArgs,
  });
}

export function printNodeConfigHelpIfRequested<TConfig>(
	options: NodeConfigHelpOptions<TConfig>,
): boolean {
	const helpFlag = options.helpFlag ?? '--help';
	const cliArgs = options.cliArgs ?? process.argv.slice(2);

	if (!cliArgs.includes(helpFlag)) {
		return false;
	}

	const text = buildConfigHelpText<TConfig>({
		schema: options.schema,
		envPrefix: options.envPrefix,
		cliPrefix: options.cliPrefix,
		defaults: options.defaults,
		environment: options.environment,
		programName: options.programName,
	});

	const out = options.out ?? console.log;
	out(text);
	return true;
}
