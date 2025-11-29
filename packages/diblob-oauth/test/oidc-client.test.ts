import assert from 'node:assert/strict';
import test from 'node:test';
import type { Container } from '@speajus/diblob';
import { createContainer } from '@speajus/diblob';
import type { Client, Issuer, TokenSet } from 'openid-client';
import { type OidcClient, oidcClient } from '../src/blobs.js';
import { registerOAuthClientConfigBlob } from '../src/register-config.js';
import { registerOidcClientBlobs } from '../src/register-oidc.js';
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

test('OidcClient.fetchAuthorizationUrl builds URL with scopes and redirect', async () => {
	const config: OAuthClientConfig = {
		  issuerUrl: 'https://example.com',
		  clientId: 'client-id',
		  redirectUris: ['https://app.example.com/callback'],
		  defaultScopes: ['openid', 'profile'],
	};

	const fakeClient: Partial<Client> = {
		authorizationUrl(params): string {
			const url = new URL('https://example.com/authorize');
			if (params) {
				for (const [key, value] of Object.entries(params)) {
					if (typeof value === 'string') {
						url.searchParams.set(key, value);
					}
				}
			}
			return url.toString();
		},
	};

	const fakeIssuer: Partial<Issuer<Client>> = {
		Client: function Client(this: Client): void {
			Object.assign(this, fakeClient);
		} as unknown as Issuer<Client>['Client'],
	};

	const container = createTestContainer(config);
	registerOidcClientBlobs(container, { issuer: fakeIssuer as Issuer<Client> });

	const client = (await container.resolve(oidcClient)) as OidcClient;
	const url = await client.fetchAuthorizationUrl({
		  state: 'abc',
		  scopes: ['openid', 'email'],
	});

	assert.equal(url.origin, 'https://example.com');
	assert.equal(url.pathname, '/authorize');
	assert.equal(url.searchParams.get('state'), 'abc');
	assert.equal(url.searchParams.get('scope'), 'openid email');
});

test('OidcClient.exchangeAuthorizationCode enforces expected state and maps tokens', async () => {
	const config: OAuthClientConfig = {
		  issuerUrl: 'https://example.com',
		  clientId: 'client-id',
		  redirectUris: ['https://app.example.com/callback'],
		  defaultScopes: ['openid'],
	};

	const tokenSet: Partial<TokenSet> = {
		access_token: 'access',
		id_token: 'id',
		refresh_token: 'refresh',
		expires_at: Math.floor(Date.now() / 1000) + 60,
		token_type: 'Bearer',
	};

	const fakeClient: Partial<Client> = {
		async callback(): Promise<TokenSet> {
			return tokenSet as TokenSet;
		},
	};

	const fakeIssuer: Partial<Issuer<Client>> = {
		Client: function Client(this: Client): void {
			Object.assign(this, fakeClient);
		} as unknown as Issuer<Client>['Client'],
	};

	const container = createTestContainer(config);
	registerOidcClientBlobs(container, { issuer: fakeIssuer as Issuer<Client> });
	const client = (await container.resolve(oidcClient)) as OidcClient;

	await assert.rejects(
		() =>
			client.exchangeAuthorizationCode({
				code: 'code',
				redirectUri: 'https://app.example.com/callback',
				state: 'actual',
				expectedState: 'expected',
			}),
		/error/i,
	);

	const result = await client.exchangeAuthorizationCode({
		  code: 'code',
		  redirectUri: 'https://app.example.com/callback',
		  state: 's',
		  expectedState: 's',
	});

	assert.equal(result.accessToken, 'access');
	assert.equal(result.idToken, 'id');
	assert.equal(result.refreshToken, 'refresh');
	assert.equal(result.tokenType, 'Bearer');
	assert.ok(result.expiresAt instanceof Date);
});
