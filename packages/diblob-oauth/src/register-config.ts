import type { Container } from '@speajus/diblob';
import {
	  type ConfigSchema,
	  type LoadConfigOptions,
	  registerConfigBlob,
	} from '@speajus/diblob-config';
import { oauthClientConfig } from './blobs.js';
import type { OAuthClientConfig } from './types.js';

export type OAuthClientConfigSchema = ConfigSchema<OAuthClientConfig>;
export type OAuthClientConfigLoadOptions = LoadConfigOptions<OAuthClientConfig>;

export function registerOAuthClientConfigBlob(
  container: Container,
  options: OAuthClientConfigLoadOptions,
): void {
  registerConfigBlob<OAuthClientConfig>(container, oauthClientConfig, options);
}
