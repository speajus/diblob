import type { ConfigSchema, EnvironmentName } from '@speajus/diblob-config';

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
  environment?: EnvironmentName;
}

export type OAuthClientConfigSchema = ConfigSchema<OAuthClientConfig>;
