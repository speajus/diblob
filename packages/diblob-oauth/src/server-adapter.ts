import type { Container } from '@speajus/diblob';
import type { AsyncLocalStorageContext } from '@speajus/diblob-async-context';
import { createServerAdapter } from '@whatwg-node/server';
import {
	type AccessTokenVerifier,
	accessTokenVerifier,
	type OAuthSessionManager,
	type OidcClient,
	oauthClientConfig,
	oauthSessionManager,
	oidcClient,
} from './blobs.js';
import type { OAuthClientConfig } from './types.js';

interface ResolvedDeps {
	config: OAuthClientConfig;
	client: OidcClient;
	sessionManager: OAuthSessionManager;
	verifier: AccessTokenVerifier;
}

type VerifiedAccessToken = Awaited<
	ReturnType<AccessTokenVerifier['verifyAccessToken']>
>;

export interface OAuthServerAdapterOptions<TContext extends object> {
	container: Container;
	asyncContext: AsyncLocalStorageContext<TContext>;
	initializeContext(request: Request): TContext | Promise<TContext>;
	applyAuthenticatedResult?: (
		context: TContext,
		result: VerifiedAccessToken,
	) => void | Promise<void>;
	paths?: {
		login?: string;
		callback?: string;
		me?: string;
		logout?: string;
	};
	requiredScopes?: string[];
	onRequest?: (args: { request: Request; context: TContext }) =>
		| void
		| Promise<void>;
	onError?: (args: {
		request: Request;
		context: TContext;
		error: unknown;
		stage: 'callback' | 'me' | 'logout';
	}) => void | Promise<void>;
}

function parseCookies(header: string | null): Record<string, string> {
	const result: Record<string, string> = {};
	if (!header) return result;
	for (const part of header.split(';')) {
		const [key, ...rest] = part.split('=');
		if (!key) continue;
		result[key.trim()] = rest.join('=').trim();
	}
	return result;
}

function redirect(location: string, extraHeaders?: HeadersInit): Response {
	const headers = new Headers(extraHeaders);
	headers.set('Location', location);
	return new Response(null, { status: 302, headers });
}

	export function createOAuthServerAdapter<TContext extends object>(
		options: OAuthServerAdapterOptions<TContext>,
	) {
		const {
			container,
			asyncContext,
			initializeContext,
			applyAuthenticatedResult,
			paths,
			requiredScopes,
			onRequest,
			onError,
		} = options;
	
		const loginPath = paths?.login ?? '/login';
		const callbackPath = paths?.callback ?? '/callback';
		const mePath = paths?.me ?? '/me';
		const logoutPath = paths?.logout;
		const scopes = requiredScopes && requiredScopes.length > 0
			? requiredScopes
			: ['openid'];
	
		let resolved: ResolvedDeps | null = null;
	
		async function ensureDeps(): Promise<ResolvedDeps> {
			if (!resolved) {
				const [config, client, sessionManager, verifier] = await Promise.all([
					container.resolve(oauthClientConfig),
					container.resolve(oidcClient),
					container.resolve(oauthSessionManager),
					container.resolve(accessTokenVerifier),
				]);
				resolved = { config, client, sessionManager, verifier };
			}
			return resolved;
		}
	
		return createServerAdapter(async (request: Request) => {
			const ctx = await initializeContext(request);
			return asyncContext.runWithContext(ctx, async () => {
				const url = new URL(request.url);
				const { pathname, searchParams } = url;
				const cookies = parseCookies(request.headers.get('cookie'));
				const deps = await ensureDeps();
				
				if (onRequest) {
					await onRequest({ request, context: ctx });
				}
		
				if (request.method === 'GET' && pathname === loginPath) {
					const authorizationUrl = await deps.client.fetchAuthorizationUrl({
						state: 'demo-state',
					});
					return redirect(authorizationUrl.toString());
				}
		
				if (request.method === 'GET' && pathname === callbackPath) {
					const code = searchParams.get('code');
					const state = searchParams.get('state') ?? undefined;
					if (!code) {
						return new Response('Missing code', { status: 400 });
					}
		
					try {
						const tokens = await deps.client.exchangeAuthorizationCode({
							code,
							redirectUri: deps.config.redirectUris[0] ?? '',
							state,
							expectedState: state,
						});
		
						const { sessionId } = await deps.sessionManager.createSession({
							accessToken: tokens.accessToken,
							idToken: tokens.idToken,
							refreshToken: tokens.refreshToken,
							expiresAt: tokens.expiresAt,
						});
		
						return redirect(mePath, {
							'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Path=/; SameSite=Lax`,
						});
					} catch (error) {
						if (onError) {
							await onError({ request, context: ctx, error, stage: 'callback' });
						}
						return new Response('Error handling callback', { status: 500 });
					}
				}
		
				if (request.method === 'GET' && pathname === mePath) {
					const sessionId = cookies.sessionId;
					if (!sessionId) {
						return new Response('Missing session', { status: 401 });
					}
		
					const session = await deps.sessionManager.fetchSession(sessionId);
					if (!session) {
						return new Response('Invalid session', { status: 401 });
					}
					
					try {
						const result = await deps.verifier.verifyAccessToken(session.accessToken, {
							requiredScopes: scopes,
						});
					
						if (applyAuthenticatedResult) {
							await applyAuthenticatedResult(ctx, result);
						}
					
						return new Response(JSON.stringify(result), {
							status: 200,
							headers: { 'Content-Type': 'application/json' },
						});
					} catch (error) {
						if (onError) {
							await onError({ request, context: ctx, error, stage: 'me' });
						}
						return new Response('Invalid token', { status: 401 });
					}
				}
		
				if (logoutPath && request.method === 'POST' && pathname === logoutPath) {
					const sessionId = cookies.sessionId;
					if (!sessionId) {
						return new Response(null, {
							status: 204,
							headers: {
								'Set-Cookie':
									'sessionId=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0',
							},
						});
					}
		
					try {
						await deps.sessionManager.invalidateSession(sessionId);
						return new Response(null, {
							status: 204,
							headers: {
								'Set-Cookie':
									'sessionId=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0',
							},
						});
					} catch (error) {
						if (onError) {
							await onError({ request, context: ctx, error, stage: 'logout' });
						}
						return new Response('Error during logout', { status: 500 });
					}
				}
		
				return new Response('Not found', { status: 404 });
			});
		});
	}

