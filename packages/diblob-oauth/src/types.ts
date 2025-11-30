import type { EnvironmentName } from '@speajus/diblob-config';

	export interface OAuthClientConfig {
	  issuerUrl: string;
	  clientId: string;
	  clientSecret?: string;
	  redirectUris: string[];
	  defaultScopes: string[];
	  tokenEndpointAuthMethod?:
	    | 'client_secret_basic'
	    | 'client_secret_post'
	    | 'private_key_jwt'
	    | 'none';
	  clockSkewSeconds?: number;
	  allowedAudiences?: string[];
	  /** Optional post-logout redirect URI used with the IdP end_session_endpoint. */
	  postLogoutRedirectUri?: string;
	  environment?: EnvironmentName;
	}
