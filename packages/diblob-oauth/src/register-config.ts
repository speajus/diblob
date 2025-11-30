import type { Container } from '@speajus/diblob';
import { type LoadConfigOptions, registerConfigBlob } from '@speajus/diblob-config';
import { oauthClientConfig } from './blobs.js';
import { OAuthClientConfigSchema } from './config.js';
import type { OAuthClientConfig } from './types.js';

export type OAuthClientConfigLoadOptions = LoadConfigOptions<OAuthClientConfig>;

const DEFAULT = {
  schema: OAuthClientConfigSchema,
  envPrefix: 'OAUTH_',
};

export function registerOAuthClientConfigBlob(
  container: Container,
  options: Partial<OAuthClientConfigLoadOptions> = DEFAULT,
): void {
  registerConfigBlob<OAuthClientConfig>(container, oauthClientConfig, {
    ...DEFAULT,
    ...options,
  });
}
