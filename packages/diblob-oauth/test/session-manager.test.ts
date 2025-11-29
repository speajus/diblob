import assert from 'node:assert/strict';
import test from 'node:test';
import { createContainer } from '@speajus/diblob';
import { type OAuthSessionManager, oauthSessionManager } from '../src/blobs.js';
import { registerInMemorySessionManager } from '../src/sessions.js';

test('InMemorySessionManager create, fetch, and invalidate sessions', async () => {
	const container = createContainer();
	registerInMemorySessionManager(container);

	const manager = (await container.resolve(
		oauthSessionManager,
	)) as OAuthSessionManager;
	const { sessionId } = await manager.createSession({
		  accessToken: 'access-token',
		  idToken: 'id-token',
		  refreshToken: 'refresh-token',
		  expiresAt: new Date(),
	});

	const loaded = await manager.fetchSession(sessionId);
	assert.ok(loaded);
	assert.equal(loaded?.accessToken, 'access-token');

	await manager.invalidateSession(sessionId);
	const after = await manager.fetchSession(sessionId);
	assert.equal(after, null);
});
