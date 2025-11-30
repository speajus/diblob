import assert from 'node:assert/strict';
import test from 'node:test';
import type { Container } from '@speajus/diblob';
import { createContainer } from '@speajus/diblob';
import type { Client, Issuer } from 'openid-client';
import { type AccessTokenVerifier, accessTokenVerifier } from '../src/blobs.js';
import { registerOAuthClientConfigBlob } from '../src/register-config.js';
import { registerAccessTokenVerifier } from '../src/tokens.js';
import type { OAuthClientConfig } from '../src/types.js';

function createTestContainer(config: OAuthClientConfig): Container {
	const container = createContainer();
	registerOAuthClientConfigBlob(container, {
		  schema: {
			  parse: (value: unknown) => value as OAuthClientConfig,
		  },
		  fileConfig: config,
	});
	return container;
}

test('AccessTokenVerifier.verifyAccessToken maps claims and scopes', async () => {
	const config: OAuthClientConfig = {
		  issuerUrl: 'https://example.com',
		  clientId: 'client-id',
		  redirectUris: ['https://app.example.com/callback'],
		  defaultScopes: ['openid'],
		  allowedAudiences: ['api://default'],
	};

	

	const fakeClaims = {
		sub: 'user-123',
		aud: ['api://default'],
		scope: 'openid profile',
	};

	const fakeClient: Partial<Client> = {
		async introspect(): Promise<{
			  active: boolean;
			  sub: string;
			  aud: string[];
			  scope: string;
		}> {
			return {
				active: true,
				// Cast to satisfy the type checker while keeping the shape we use
				sub: fakeClaims.sub as string,
				aud: fakeClaims.aud as string[],
				scope: fakeClaims.scope as string,
			};
		},
	};

		const fakeIssuer: Partial<Issuer<Client>> = {
			metadata: {
				issuer: 'https://example.com',
				introspection_endpoint: 'https://example.com/oauth2/introspect',
			},
			Client: function Client(this: Client): void {
				Object.assign(this, fakeClient);
			} as unknown as Issuer<Client>['Client'],
		};

	const container = createTestContainer(config);
	registerAccessTokenVerifier(container, { issuer: fakeIssuer as Issuer<Client> });

	const verifier = (await container.resolve(accessTokenVerifier)) as AccessTokenVerifier;
	const result = await verifier.verifyAccessToken('access', {
		  requiredScopes: ['profile'],
	});

	assert.equal(result.subject, 'user-123');
	assert.deepEqual(result.scopes, ['openid', 'profile']);
	assert.equal(result.claims.sub, 'user-123');
});
