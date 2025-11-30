import { createServer } from 'node:http';
import { URL } from 'node:url';
import { createContainer } from '@speajus/diblob';
import { logger, registerLoggerBlobs } from '@speajus/diblob-logger';
import {
			  accessTokenVerifier,
			  oauthClientConfig,
			  oauthSessionManager,
			  oidcClient,
			  registerAccessTokenVerifier,
			  registerInMemorySessionManager,
        registerOAuthClientConfigBlob,
			  registerOidcClientBlobs,
		} from '@speajus/diblob-oauth';
import { config as loadEnv } from 'dotenv';

function parseCookies(cookieHeader: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.split('=');
    if (!key) continue;
    result[key.trim()] = rest.join('=').trim();
  }
  return result;
}

// Load .env into process.env for local development. In production, prefer
// real environment variables and secrets management.
loadEnv();

const container = createContainer();
registerLoggerBlobs(container);
registerOidcClientBlobs(container);
registerAccessTokenVerifier(container);
registerInMemorySessionManager(container);
registerOAuthClientConfigBlob(container);

const appLogger = await container.resolve(logger);
const config = await container.resolve(oauthClientConfig);
const client = await container.resolve(oidcClient);
const verifier = await container.resolve(accessTokenVerifier);
const sessionManager = await container.resolve(oauthSessionManager);

appLogger.info('OAuth Cognito example initialized', { issuerUrl: config.issuerUrl });

const server = createServer(async (req, res) => {
  if (!req.url) {
    res.statusCode = 400;
    res.end('Invalid request');
    return;
  }

  const url = new URL(req.url, 'http://localhost:3005');
  const cookies = parseCookies(req.headers.cookie ?? '');

  if (req.method === 'GET' && url.pathname === '/login') {
    const authorizationUrl = await client.fetchAuthorizationUrl({ state: 'demo-state' });
    res.statusCode = 302;
    res.setHeader('Location', authorizationUrl.toString());
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state') ?? undefined;
    if (!code) {
      res.statusCode = 400;
      res.end('Missing code');
      return;
    }

	    try {
      const tokens = await client.exchangeAuthorizationCode({
        code,
        redirectUri: config.redirectUris[0] ?? '',
        state,
        // For a real app, compare against a server-side stored state value.
        expectedState: state,
      });

      const { sessionId } = await sessionManager.createSession({
        accessToken: tokens.accessToken,
        idToken: tokens.idToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      });

      res.statusCode = 302;
      res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Path=/; SameSite=Lax`);
      res.setHeader('Location', '/me');
      res.end();
    } catch (error) {
	      const err = error as Error & { error?: unknown; error_description?: string };
	      appLogger.error('Callback handling failed', {
	        errorName: err.name,
	        errorMessage: err.message,
	        errorStack: err.stack,
	        // OpenID errors often carry extra fields
	        errorCode: err.error,
	        errorDescription: err.error_description,
	      });
      res.statusCode = 500;
      res.end('Error handling callback');
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/me') {
    const sessionId = cookies.sessionId;
    if (!sessionId) {
      res.statusCode = 401;
      res.end('Missing session');
      return;
    }

    const session = await sessionManager.fetchSession(sessionId);
    if (!session) {
      res.statusCode = 401;
      res.end('Invalid session');
      return;
    }

    try {
      const result = await verifier.verifyAccessToken(session.accessToken, {
        requiredScopes: ['openid'],
      });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (error) {
	      const err = error as Error & {
	        error?: unknown;
	        error_description?: string;
	      };
	      appLogger.error('Session verification failed', {
	        errorName: err.name,
	        errorMessage: err.message,
	        errorStack: err.stack,
	        errorCode: err.error,
	        errorDescription: err.error_description,
	      });
      res.statusCode = 401;
      res.end('Invalid token');
    }
    return;
  }

  res.statusCode = 404;
  res.end('Not Found');
});

server.listen( 3005, '127.0.0.1', () => {
  const address = server.address() as { address: string; port: number };
  appLogger.info(`OAuth Cognito example listening on`, {
    redirectUri: config.redirectUris[0],
    address: address.address,
    port: address.port,
  });
  console.log(`OAuth Cognito example listening on http://${address.address}:${address.port}/login`);
});

