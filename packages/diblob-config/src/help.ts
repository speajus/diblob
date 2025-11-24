import { z } from 'zod';
import { globalRegistry } from 'zod/v4/core';
import type { EnvironmentName } from './types.js';

export interface BuildConfigHelpTextOptions<TConfig> {
	schema: z.ZodObject<Record<string, z.ZodTypeAny>>;
	envPrefix?: string;
	cliPrefix?: string;
	defaults?:
		| Partial<TConfig>
		| ((environment: EnvironmentName) => Partial<TConfig> | undefined);
	environment?: EnvironmentName;
	programName?: string;
}

function toEnvKey(prefix: string | undefined, key: string): string | undefined {
	if (!prefix) return undefined;
	const upper = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
	return `${prefix}${upper}`;
}

function toCliFlag(prefix: string | undefined, key: string): string | undefined {
	if (!prefix) return undefined;
	const kebab = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
	return `--${prefix}${kebab}`;
}

function getTypeLabel(schema: z.ZodTypeAny): string {
	if (schema instanceof z.ZodString) return 'string';
	if (schema instanceof z.ZodNumber) return 'number';
	if (schema instanceof z.ZodBoolean) return 'boolean';
	if (schema instanceof z.ZodEnum) {
		const values: readonly string[] =
			((schema as any).options ?? (schema as any)._def?.values) ?? [];
		return `enum(${values.join(' | ')})`;
	}
	if (schema instanceof z.ZodArray) {
		const element = (schema as any).element as z.ZodTypeAny;
		return `array<${getTypeLabel(element)}>`;
	}
	return 'unknown';
}

function getDescription(schema: z.ZodTypeAny): string | undefined {
	
	// Zod v4 stores human-readable documentation in a global registry rather
	// than directly on the schema instance.
	return schema.description ?? globalRegistry.get(schema)?.description;
}

export function buildConfigHelpText<TConfig>(
	options: BuildConfigHelpTextOptions<TConfig>,
): string {
	const {
		schema,
		envPrefix,
		cliPrefix,
		defaults,
		programName = 'application',
	} = options;

	const environment: EnvironmentName =
		options.environment ?? ('development' as EnvironmentName);

	const resolvedDefaults =
		typeof defaults === 'function' ? defaults(environment) ?? {} : defaults ?? {};

	const lines: string[] = [];
	lines.push(`Usage: ${programName} [options]`);
	lines.push('');
	lines.push('Configuration options:');

	const shape = schema.shape;
	for (const key of Object.keys(shape)) {
		const fieldSchema = shape[key];
		const envKey = toEnvKey(envPrefix, key);
		const flag = toCliFlag(cliPrefix, key);
		const typeLabel = getTypeLabel(fieldSchema);
		const description = getDescription(fieldSchema);
		const defaultValue =
			resolvedDefaults && Object.hasOwn(resolvedDefaults, key)
				? (resolvedDefaults as any)[key]
				: undefined;

		lines.push('');
		lines.push(`  ${key}`);
		if (envKey) {
			lines.push(`    env:  ${envKey}`);
		}
		if (flag) {
			lines.push(`    flag: ${flag}`);
		}
		lines.push(`    type: ${typeLabel}`);
		if (defaultValue !== undefined) {
			lines.push(`    default: ${JSON.stringify(defaultValue)}`);
		}
		if (description) {
			lines.push(`    description: ${description}`);
		}
	}

	return lines.join('\n');
}
