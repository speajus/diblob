import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { createBlob, createContainer } from '@speajus/diblob';
import { AsyncLocalStorageContext } from '@speajus/diblob-async-context';
import { logger, registerLoggerBlobs } from '@speajus/diblob-logger';
import {
	createOAuthServerAdapter,
	oauthClientConfig,
	registerAccessTokenVerifier,
	registerInMemorySessionManager,
	registerOAuthClientConfigBlob,
	registerOidcClientBlobs,
} from '@speajus/diblob-oauth';
import { config as loadEnv } from 'dotenv';

interface RequestContext {
	requestId: string;
	userId?: string;
	tenantId?: string;
}

const requestContext = createBlob<RequestContext>('requestContext');

// Load .env into process.env for local development. In production, prefer
// real environment variables and secrets management.
loadEnv();

	const container = createContainer();
	registerLoggerBlobs(container);
	registerOidcClientBlobs(container);
	registerAccessTokenVerifier(container);
	registerInMemorySessionManager(container);
	registerOAuthClientConfigBlob(container);

	const asyncContext = new AsyncLocalStorageContext(container);
	asyncContext.registerWithContext(requestContext);

const appLogger = await container.resolve(logger);
const config = await container.resolve(oauthClientConfig);

appLogger.info('OAuth Cognito example initialized', { issuerUrl: config.issuerUrl });

		const adapter = createOAuthServerAdapter<RequestContext>({
			container,
			asyncContext,
			contextBlob: requestContext,
			initializeContext: () => ({ requestId: randomUUID() }),
		applyAuthenticatedResult: (context, result) => {
			context.userId = result.subject;
		},
		paths: {
			logout: '/logout',
		},
		onRequest: ({ request, context }) => {
			const url = new URL(request.url);
			appLogger.info('HTTP request', {
				method: request.method,
				path: url.pathname,
				requestId: context.requestId,
			});
		},
		onError: ({ request, context, error, stage }) => {
			const url = new URL(request.url);
			appLogger.error('OAuth adapter error', {
				method: request.method,
				path: url.pathname,
				requestId: context.requestId,
				stage,
				error,
			});
		},
		});

	const server = createServer((req, res) => {
		const url = new URL(req.url ?? '/', 'http://localhost');
		if (req.method === 'GET' && url.pathname === '/loggedout') {
			res.statusCode = 200;
			res.setHeader('Content-Type', 'text/html; charset=utf-8');
			res.end(
				`<!DOCTYPE html><html><body><h1>Logged out</h1><p>You have been logged out of Cognito.</p>
				<a href="/login">Log in again</a>
				</body></html>`,
			);	
			return;
		}

		return adapter(req, res);
	});

	server.listen(3005, '127.0.0.1', () => {
		const address = server.address() as { address: string; port: number };
		appLogger.info(`OAuth Cognito example listening on`, {
			redirectUri: config.redirectUris[0],
			address: address.address,
			port: address.port,
		});
		console.log(
			`OAuth Cognito example listening on http://${address.address}:${address.port}/login`,
		);
	});

