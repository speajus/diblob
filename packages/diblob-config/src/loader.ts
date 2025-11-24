import type { EnvironmentName, LoadConfigOptions } from './types.js';

type AnyRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(target: AnyRecord, source: AnyRecord): AnyRecord {
  const result: AnyRecord = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMerge(result[key] as AnyRecord, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function normalizeKey(rawKey: string): string {
  const lower = rawKey.toLowerCase();
  const parts = lower.split(/[-_]+/).filter(Boolean);
  if (parts.length === 0) return lower;
  const [first, ...rest] = parts;
  return first + rest.map((p) => p[0]?.toUpperCase() + p.slice(1)).join('');
}

function coercePrimitive(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  const num = Number(value);
  if (!Number.isNaN(num) && value.trim() !== '') return num;
  return value;
}

function parseCliArgs(args: string[], prefix: string): AnyRecord {
  const result: AnyRecord = {};
  for (const arg of args) {
    if (!arg.startsWith('--')) continue;
    const withoutDashes = arg.slice(2);
    const [rawKey, rawValue] = withoutDashes.split('=', 2);
    if (!rawKey || !rawKey.startsWith(prefix) || rawValue === undefined) continue;
    const keyPart = rawKey.slice(prefix.length);
    if (!keyPart) continue;
    const configKey = normalizeKey(keyPart);
    result[configKey] = coercePrimitive(rawValue);
  }
  return result;
}

function getEnvironmentName(options: LoadConfigOptions<unknown>): EnvironmentName {
  if (options.environment) return options.environment as EnvironmentName;
  return 'development';
}

export function loadConfig<TConfig>(options: LoadConfigOptions<TConfig>): TConfig {
  const environment = getEnvironmentName(options);

  let raw: AnyRecord = {};

  const defaults =
    typeof options.defaults === 'function'
      ? options.defaults(environment)
      : options.defaults;
  if (defaults) {
    raw = deepMerge(raw, defaults as AnyRecord);
  }

  if (options.fileConfig && isPlainObject(options.fileConfig)) {
    raw = deepMerge(raw, options.fileConfig as AnyRecord);
  }

  const env = options.env ?? {};
  const envPrefix = options.envPrefix;
  for (const [key, value] of Object.entries(env)) {
    if (value == null) continue;
    if (envPrefix && !key.startsWith(envPrefix)) continue;
    const rawKey = envPrefix ? key.slice(envPrefix.length) : key;
    if (!rawKey) continue;
    const configKey = normalizeKey(rawKey);
    raw[configKey] = coercePrimitive(value);
  }

  if (options.cliPrefix && options.cliArgs && options.cliArgs.length > 0) {
    const cliOverlay = parseCliArgs(options.cliArgs, options.cliPrefix);
    raw = deepMerge(raw, cliOverlay);
  }

  return options.schema.parse(raw);
}
