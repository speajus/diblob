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

## Generic WHATWG server adapter + async context

For HTTP servers, `@speajus/diblob-oauth` also provides a generic adapter built on
[`@whatwg-node/server`](https://github.com/ardatan/whatwg-node) that ties
everything together:

- OAuth/OIDC blobs from this package (`oidcClient`, `oauthSessionManager`,
  `accessTokenVerifier`, `oauthClientConfig`)
- A request-scoped async context from
  [`@speajus/diblob-async-context`](https://www.npmjs.com/package/@speajus/diblob-async-context)

The adapter is exported as:

- `createOAuthServerAdapter<TContext extends object>(options)`
- `OAuthServerAdapterOptions<TContext>`

### Basic Node HTTP usage

```ts
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { createBlob, createContainer } from '@speajus/diblob';
import { AsyncLocalStorageContext } from '@speajus/diblob-async-context';
import {
  createOAuthServerAdapter,
  oauthClientConfig,
  registerAccessTokenVerifier,
  registerInMemorySessionManager,
  registerOAuthClientConfigBlob,
  registerOidcClientBlobs,
} from '@speajus/diblob-oauth';

interface RequestContext {
  requestId: string;
  userId?: string;
}

const requestContext = createBlob<RequestContext>('requestContext');

const container = createContainer();
registerOAuthClientConfigBlob(container);
registerOidcClientBlobs(container);
registerAccessTokenVerifier(container);
registerInMemorySessionManager(container);

const asyncContext = new AsyncLocalStorageContext<RequestContext>(container);
asyncContext.registerWithContext(requestContext);

const adapter = createOAuthServerAdapter<RequestContext>({
  container,
  asyncContext,
  initializeContext: () => ({ requestId: randomUUID() }),
  applyAuthenticatedResult: (context, result) => {
    context.userId = result.subject;
  },
});

const server = createServer(adapter);
server.listen(3005);
```

Every request is wrapped in `asyncContext.runWithContext(context, handler)`, so
downstream code can resolve `requestContext` from the container and read
`requestId`, `userId`, etc., while the adapter handles `/login`, `/callback`,
and `/me` using the blobs from this package.

### Customizing paths, scopes, and hooks

`OAuthServerAdapterOptions<TContext>` supports several optional settings:

	- `paths` – override default route paths:
  - `login` (default `/login`)
  - `callback` (default `/callback`)
  - `me` (default `/me`)
  - `logout` (no route by default; if set, `POST /logout` will invalidate the
    session and clear the cookie)
	- `requiredScopes` – scopes required by `/me` (default `['openid']`)
	- `onRequest` – called for every request after the async context is
  established:

  ```ts
  onRequest: async ({ request, context }) => {
    // e.g., log request + requestId using your logger blob
  }
  ```

	- `onError` – called when an internal error occurs in one of the built-in
  routes:

  ```ts
  onError: async ({ request, context, error, stage }) => {
    // stage is 'callback', 'me', or 'logout'
  }
  ```

The [`examples/oauth-cognito`](https://github.com/jspears/diblob/tree/main/examples/oauth-cognito)
project shows a complete setup that wires this adapter together with a
request-scoped context and `@speajus/diblob-logger`.
