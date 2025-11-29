import type { Container } from '@speajus/diblob';
import { Lifecycle } from '@speajus/diblob';
import { type OAuthSessionManager, oauthSessionManager } from './blobs.js';

interface SessionRecord {
	accessToken: string;
	idToken?: string;
	refreshToken?: string;
	expiresAt?: Date;
}

export interface InMemorySessionManagerOptions {
	// Reserved for future use (e.g., default TTL). Currently unused.
	defaultTtlMs?: number;
}

export function registerInMemorySessionManager(
	container: Container,
	_options: InMemorySessionManagerOptions = {},
): void {
	container.register(
		oauthSessionManager,
		(): OAuthSessionManager => {
			const sessions = new Map<string, SessionRecord>();

			const manager: OAuthSessionManager = {
				async createSession(params) {
					const sessionId =
						Math.random().toString(36).slice(2) +
						Math.random().toString(36).slice(2);
					sessions.set(sessionId, {
						accessToken: params.accessToken,
						idToken: params.idToken,
						refreshToken: params.refreshToken,
						expiresAt: params.expiresAt,
					});
					return { sessionId };
				},

				async invalidateSession(sessionId: string): Promise<void> {
					sessions.delete(sessionId);
				},

				async fetchSession(sessionId: string) {
					const record = sessions.get(sessionId);
					if (!record) {
						return null;
					}
					return {
						accessToken: record.accessToken,
						idToken: record.idToken,
						refreshToken: record.refreshToken,
						expiresAt: record.expiresAt,
					};
				},
			};

			return manager;
		},
		{ lifecycle: Lifecycle.Singleton },
	);
}

export { oauthSessionManager };
export type { OAuthSessionManager };
