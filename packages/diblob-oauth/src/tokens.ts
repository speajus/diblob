import type { Container } from '@speajus/diblob';
import { Lifecycle } from '@speajus/diblob';
import type { Client, Issuer } from 'openid-client';
import {
	type AccessTokenVerifier,
	accessTokenVerifier,
	oauthClientConfig,
} from './blobs.js';
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

function decodeJwtPayload(token: string): Record<string, unknown> | undefined {
	const parts = token.split('.');
	if (parts.length < 2) return undefined;
	try {
		const json = Buffer.from(parts[1], 'base64url').toString('utf8');
		return JSON.parse(json) as Record<string, unknown>;
	} catch {
		return undefined;
	}
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
							// Prefer RFC 7662 token introspection when the issuer supports it.
							if (issuer.metadata.introspection_endpoint) {
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
								if (
									verifyOptions?.requiredScopes &&
									verifyOptions.requiredScopes.length > 0
								) {
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
							}

							// Fallback for issuers (like Cognito) that do not expose
							// an OAuth 2.0 introspection endpoint. In this case we rely
							// on calling the UserInfo endpoint with the access token.
							const userinfo = (await client.userinfo(token)) as {
								sub?: string;
								[key: string]: unknown;
							};

							if (!userinfo.sub) {
								throw new Error('Access token missing subject');
							}

							const jwtClaims = decodeJwtPayload(token);
							const scopes = extractScopes(
								jwtClaims && typeof jwtClaims.scope === 'string'
									? jwtClaims.scope
									: undefined,
							);

							if (
								verifyOptions?.requiredScopes &&
								verifyOptions.requiredScopes.length > 0
							) {
								const missingScope = verifyOptions.requiredScopes.find(
									(scope) => !scopes?.includes(scope),
								);
								if (missingScope) {
									throw new Error('Access token missing required scope');
								}
							}

							return {
								subject: userinfo.sub,
								scopes,
								claims: userinfo,
							};
				},
			};

			return verifier;
		},
		oauthClientConfig,
		{ lifecycle: Lifecycle.Singleton },
	);
}
