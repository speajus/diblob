export type EnvironmentName =
  | 'development'
  | 'test'
  | 'staging'
  | 'production'
  | (string & {});

/**
 * Minimal schema interface expected by loadConfig.
 *
 * This is structurally compatible with Zod schemas that expose a `parse`
 * method, but does not depend on Zod directly.
 */
export interface ConfigSchema<TConfig> {
  parse(input: unknown): TConfig;
}

export interface LoadConfigOptions<TConfig> {
  /** Runtime schema used for validation and coercion. */
  schema: ConfigSchema<TConfig>;

  /**
   * Default values applied before file/env/CLI. May be static or depend on the
   * resolved environment.
   */
  defaults?: Partial<TConfig> | ((environment: EnvironmentName) => Partial<TConfig>);

  /**
   * Named environment, e.g. "development" or "production". If omitted,
   * `loadConfig` will default to "development".
   */
  environment?: EnvironmentName;

  /**
   * Optional prefix for environment variables, e.g. "APP_".
   */
  envPrefix?: string;

  /**
   * Env record to read from (e.g. `process.env` on Node, `import.meta.env` in
   * a bundler, or a test double). If omitted, no environment variables are
   * applied.
   */
  env?: Record<string, string | undefined>;

  /**
   * Raw configuration values loaded from a JSON (or similar) file. The caller
   * is responsible for reading and parsing the file in their environment.
   */
  fileConfig?: unknown;

  /**
   * CLI arguments (e.g. `process.argv.slice(2)` on Node). If omitted, CLI
   * switches are ignored.
   */
  cliArgs?: string[];

  /**
   * Prefix for CLI switches, e.g. "app-" to match --app-port=3000. If not
   * provided, CLI switches are ignored.
   */
  cliPrefix?: string;
}
