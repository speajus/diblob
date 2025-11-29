# @speajus/diblob-oauth

`@speajus/diblob-oauth` provides OAuth 2.1 / OpenID Connect integration for diblob
containers, built on top of [`openid-client`](https://github.com/panva/node-openid-client).

It focuses on:

- Authorization Code + PKCE flows for browser-based clients
- Verifying bearer access tokens for APIs
- Optional server-side session management backed by OAuth tokens

## Blobs

- `oauthClientConfig` – strongly-typed OAuth client configuration
- `oidcClient` – high-level OIDC client for browser login flows
- `accessTokenVerifier` – verifies bearer tokens for APIs
- `oauthSessionManager` – abstraction for server-side sessions

## Registration helpers

- `registerOAuthClientConfigBlob(container, options)`
- `registerOidcClientBlobs(container, options)`
- `registerAccessTokenVerifier(container, options)`
- `registerInMemorySessionManager(container, options?)`

## Basic usage

Example: configure an AWS Cognito app client and use `oidcClient` to build the
authorization URL, then verify tokens in an API service.

### End-to-end login flow (browser → Cognito → API)

The Cognito example in `examples/oauth-cognito` wires these pieces together:

1. **/login**
   - Your HTTP handler resolves `oidcClient` from the container.
   - Calls `oidcClient.fetchAuthorizationUrl({ state })`.
   - Redirects the browser to the returned URL.

2. **/callback**
   - Cognito redirects back with `code` (and `state`).
   - The handler resolves `oidcClient` and `oauthClientConfig`.
   - Calls `oidcClient.exchangeAuthorizationCode({ code, redirectUri, state, expectedState })`.
   - Resolves `oauthSessionManager` and calls
     `oauthSessionManager.createSession({ accessToken, idToken, refreshToken, expiresAt })`.
   - Sets a `sessionId` cookie and redirects to a protected route (for example `/me`).

3. **/me** (protected API)
   - Reads the `sessionId` cookie.
   - Resolves `oauthSessionManager` and `accessTokenVerifier`.
   - Calls `oauthSessionManager.fetchSession(sessionId)`; if missing, returns `401`.
   - Calls `accessTokenVerifier.verifyAccessToken(session.accessToken, { requiredScopes })`.
   - On success, returns a small JSON payload (for example `{ subject, scopes }`).

### In-memory session manager

For simple demos and local development you can use the built-in in-memory
session manager:

```ts
registerInMemorySessionManager(container);
```

This registers `oauthSessionManager` as a singleton that stores sessions in
memory only. For production scenarios you should provide your own
`OAuthSessionManager` implementation backed by a durable store (for example,
Redis or a database).
