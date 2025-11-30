import type { Container } from '@speajus/diblob';
import { Lifecycle } from '@speajus/diblob';
import type { Client, Issuer } from 'openid-client';
import { type OidcClient, oauthClientConfig, oidcClient } from './blobs.js';
import type { OAuthClientConfig } from './types.js';

export interface RegisterOidcClientOptions {
  /** Optional preconfigured issuer instance for advanced scenarios/testing. */
  issuer?: Issuer<Client>;
}

export function registerOidcClientBlobs(
  container: Container,
  options: RegisterOidcClientOptions = {},
): void {
	  container.register(
	    oidcClient,
	    async (config: OAuthClientConfig): Promise<OidcClient> => {
	      const issuer =
	        options.issuer ??
	        (await (await import('openid-client')).Issuer.discover(config.issuerUrl));

	      const client = new issuer.Client({
	        client_id: config.clientId,
	        client_secret: config.clientSecret,
	        redirect_uris: config.redirectUris,
	        token_endpoint_auth_method:
	          config.tokenEndpointAuthMethod ?? 'client_secret_basic',
	      });

	      const implementation: OidcClient = {
	        async fetchAuthorizationUrl(params) {
	          const url = client.authorizationUrl({
	            redirect_uri: params.redirectUri ?? config.redirectUris[0],
	            scope: (params.scopes ?? config.defaultScopes).join(' '),
	            state: params.state,
	            nonce: params.nonce,
	            ...params.additionalParams,
	          });
	          return new URL(url);
	        },

	        async exchangeAuthorizationCode(input) {
	          const callbackParams = { code: input.code, state: input.state };

	          if (input.expectedState && input.state !== input.expectedState) {
	            throw new Error('OAuth state mismatch');
	          }
		
		          const checks: { state?: string } = {};
		          if (typeof input.expectedState === 'string') {
		            checks.state = input.expectedState;
		          } else if (typeof input.state === 'string') {
		            checks.state = input.state;
		          }
		
		          const tokenSet = await client.callback(
		            input.redirectUri,
		            callbackParams,
		            checks,
		          );

	          return {
				// biome-ignore lint/style/noNonNullAssertion: trust me
	            accessToken: tokenSet.access_token!,
	            idToken: tokenSet.id_token,
	            refreshToken: tokenSet.refresh_token,
	            expiresAt: tokenSet.expires_at
	              ? new Date(tokenSet.expires_at * 1000)
	              : undefined,
	            tokenType: tokenSet.token_type,
	            raw: tokenSet,
	          };
	        },

	        async refreshTokens(input) {
	          const tokenSet = await client.refresh(input.refreshToken);
	          return {
	            // biome-ignore lint/style/noNonNullAssertion: trust me
	            accessToken: tokenSet.access_token!,
	            idToken: tokenSet.id_token,
	            refreshToken: tokenSet.refresh_token,
	            expiresAt: tokenSet.expires_at
	              ? new Date(tokenSet.expires_at * 1000)
	              : undefined,
	            tokenType: tokenSet.token_type,
	            raw: tokenSet,
	          };
	        },
	      };

	      return implementation;
	    },
	    oauthClientConfig,
	    { lifecycle: Lifecycle.Singleton },
	  );
}
