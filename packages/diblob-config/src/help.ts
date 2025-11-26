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
				type EnumSchemaLike = {
					options?: readonly unknown[];
					_def?: { values?: readonly unknown[] };
				};
				const enumSchema = schema as unknown as EnumSchemaLike;
				const rawValues =
					enumSchema.options ?? enumSchema._def?.values ?? [];
				const values = rawValues.filter(
					(value): value is string => typeof value === 'string',
				);
		return `enum(${values.join(' | ')})`;
	}
	if (schema instanceof z.ZodArray) {
				const arraySchema = schema as unknown as { element: z.ZodTypeAny };
				const { element } = arraySchema;
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
			const defaultsRecord = resolvedDefaults as
				| Partial<Record<string, unknown>>
				| undefined;
			const defaultValue =
				defaultsRecord && Object.hasOwn(defaultsRecord, key)
					? defaultsRecord[key]
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
