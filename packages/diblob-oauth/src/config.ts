import type { ConfigSchema } from '@speajus/diblob-config';
import { z } from 'zod';
import type { OAuthClientConfig } from './types.js';

function coerceStringArray(value: unknown): unknown {
	if (Array.isArray(value)) return value;
	if (value == null) return value;

	const raw = String(value).trim();
	if (raw === '') return [];

	// Support comma- or whitespace-separated lists for convenience in env/CLI.
	if (raw.includes(',')) {
		return raw
			.split(',')
			.map((part) => part.trim())
			.filter((part) => part.length > 0);
	}

	if (raw.includes(' ')) {
		return raw
			.split(/\s+/)
			.map((part) => part.trim())
			.filter((part) => part.length > 0);
	}

	return [raw];
}

export const OAuthClientConfigSchema = z
	.object({
		issuerUrl: z
			.string()
			.url()
			.describe(
				'OIDC issuer URL (for example: https://cognito-idp.us-east-2.amazonaws.com/your_pool).',
			),
		clientId: z
			.string()
			.min(1)
			.describe('OAuth 2.1 client identifier registered with the issuer.'),
		clientSecret: z
			.string()
			.optional()
			.describe('Optional client secret for confidential clients. Omit for public clients.'),
		redirectUris: z
			.preprocess(coerceStringArray, z.array(z.string().url()).min(1))
			.describe('Allowed redirect URIs for this client.'),
		defaultScopes: z
			.preprocess(coerceStringArray, z.array(z.string()).min(1))
			.describe('Default scopes to request when none are provided explicitly.'),
		tokenEndpointAuthMethod: z
			.enum(['client_secret_basic', 'client_secret_post', 'private_key_jwt', 'none'])
			.optional()
			.describe(
				'Token endpoint authentication method; defaults to issuer/client metadata when omitted.',
			),
		clockSkewSeconds: z
			.number()
			.int()
			.nonnegative()
			.optional()
			.describe('Allowed clock skew when validating tokens, in seconds.'),
		allowedAudiences: z
			.preprocess(coerceStringArray, z.array(z.string()))
			.optional()
			.describe('Optional list of accepted token audiences.'),
		environment: z
			.string()
			.optional()
			.describe('Optional environment label (for example: development, staging, production).'),
	}) satisfies ConfigSchema<OAuthClientConfig>;

