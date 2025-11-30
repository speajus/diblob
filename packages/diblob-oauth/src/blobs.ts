import { createBlob } from '@speajus/diblob';
import type { OAuthClientConfig } from './types.js';

export const oauthClientConfig = createBlob<OAuthClientConfig>('oauthClientConfig');

export interface OidcClient {
  fetchAuthorizationUrl(options: {
    redirectUri?: string;
    state?: string;
    nonce?: string;
    scopes?: string[];
    additionalParams?: Record<string, string>;
  }): Promise<URL>;

  exchangeAuthorizationCode(input: {
    code: string;
    redirectUri: string;
    state?: string;
    expectedState?: string;
  }): Promise<{
    accessToken: string;
    idToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    tokenType?: string;
    raw: Record<string, unknown>;
  }>;

  refreshTokens(input: {
    refreshToken: string;
  }): Promise<{
    accessToken: string;
    idToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    tokenType?: string;
    raw: Record<string, unknown>;
  }>;

	  buildEndSessionUrl(input: {
	    postLogoutRedirectUri: string;
	    idTokenHint?: string;
	  }): Promise<URL>;
}

export const oidcClient = createBlob<OidcClient>('oidcClient');

export interface AccessTokenVerifier {
  verifyAccessToken(token: string, options?: { requiredScopes?: string[] }): Promise<{
    subject: string;
    scopes?: string[];
    claims: Record<string, unknown>;
  }>;
}

export const accessTokenVerifier = createBlob<AccessTokenVerifier>('accessTokenVerifier');

export interface OAuthSessionManager {
  createSession(params: {
    accessToken: string;
    idToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  }): Promise<{ sessionId: string }>;

  invalidateSession(sessionId: string): Promise<void>;

  fetchSession(sessionId: string): Promise<{
    accessToken: string;
    idToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  } | null>;
}

export const oauthSessionManager = createBlob<OAuthSessionManager>('oauthSessionManager');
