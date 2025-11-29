import type { Container } from '@speajus/diblob';
import { Lifecycle } from '@speajus/diblob';
import type { Client, Issuer } from 'openid-client';
import { type AccessTokenVerifier, accessTokenVerifier, oauthClientConfig } from './blobs.js';
import type { OAuthClientConfig } from './types.js';

export interface RegisterAccessTokenVerifierOptions {
	issuer?: Issuer<Client>;
}

function extractScopes(scopeClaim: unknown): string[] | undefined {
	if (typeof scopeClaim === 'string') {
		return scopeClaim.split(/\s+/).filter(Boolean);
	}
	return undefined;
}

export function registerAccessTokenVerifier(
	container: Container,
	options: RegisterAccessTokenVerifierOptions = {},
): void {
	container.register(
		accessTokenVerifier,
		async (config: OAuthClientConfig): Promise<AccessTokenVerifier> => {
			const issuer =
				options.issuer ??
				(await (await import('openid-client')).Issuer.discover(config.issuerUrl));

			const client = new issuer.Client({
				client_id: config.clientId,
				client_secret: config.clientSecret,
			});

			const verifier: AccessTokenVerifier = {
				async verifyAccessToken(token, verifyOptions) {
					const introspection = (await client.introspect(token)) as {
						active?: boolean;
						sub?: string;
						aud?: string | string[];
						scope?: string;
						[key: string]: unknown;
					};

					if (!introspection.active) {
						throw new Error('Inactive access token');
					}

					if (!introspection.sub) {
						throw new Error('Access token missing subject');
					}

					if (config.allowedAudiences && config.allowedAudiences.length > 0) {
						const audienceClaim = introspection.aud;
						const audiences = Array.isArray(audienceClaim)
							? audienceClaim
							: audienceClaim
							  ? [audienceClaim]
							  : [];
						const hasAllowedAudience = audiences.some((aud) =>
							config.allowedAudiences?.includes(aud),
						);
						if (!hasAllowedAudience) {
							throw new Error('Access token has invalid audience');
						}
					}

					const scopes = extractScopes(introspection.scope);
					if (verifyOptions?.requiredScopes && verifyOptions.requiredScopes.length > 0) {
						const missingScope = verifyOptions.requiredScopes.find(
							(scope) => !scopes?.includes(scope),
						);
						if (missingScope) {
							throw new Error('Access token missing required scope');
						}
					}

					return {
						subject: introspection.sub,
						scopes,
						claims: introspection,
					};
				},
			};

			return verifier;
		},
		oauthClientConfig,
		{ lifecycle: Lifecycle.Singleton },
	);
}
