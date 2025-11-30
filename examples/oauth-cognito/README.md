# diblob OAuth Cognito example

This example shows how to use `@speajus/diblob-oauth` with an AWS Cognito
user pool client.

It demonstrates:

- Loading OAuth client config via `registerOAuthClientConfigBlob`
- Using `oidcClient` to build a Cognito authorization URL
- Using `accessTokenVerifier` to validate access tokens
- Managing a simple cookie-based session via `oauthSessionManager`

## Prerequisites

You need an AWS Cognito user pool and an app client configured for the
Authorization Code flow.

### Configuration via `.env`

For local development, the example uses [`dotenv`](https://www.npmjs.com/package/dotenv)
to load configuration from a `.env` file into `process.env`.

Create `examples/oauth-cognito/.env` with:

```bash
OAUTH_ISSUER_URL=https://cognito-idp.<region>.amazonaws.com/<user-pool-id>
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret   # optional
OAUTH_REDIRECT_URI=http://localhost:3000/callback
```

In production, prefer real environment variables and a secrets manager instead
of committing `.env` files.

## Running the example

From the repo root:

```sh
pnpm --filter diblob-oauth-cognito-example dev
```

Then open `http://localhost:3005/login` in your browser.

## HTTP routes

- `GET /login`
  - Builds a Cognito authorization URL via `oidcClient.fetchAuthorizationUrl`
  - Redirects the browser to Cognito

- `GET /callback`
  - Handles the OAuth redirect from Cognito
  - Exchanges the `code` for tokens via `oidcClient.exchangeAuthorizationCode`
  - Creates a server-side session via `oauthSessionManager.createSession`
  - Sets a `sessionId` HttpOnly cookie and redirects to `/me`

- `GET /me`
  - Reads the `sessionId` cookie
  - Fetches the session via `oauthSessionManager.fetchSession`
  - Verifies the access token via `accessTokenVerifier.verifyAccessToken`
  - Returns a small JSON payload containing the subject and scopes

- `POST /logout`
  - Invalidates the current `sessionId` via `oauthSessionManager.invalidateSession`
  - Clears the `sessionId` HttpOnly cookie

  From a browser or frontend app you can call it with:

  ```ts
  await fetch('/logout', {
    method: 'POST',
    credentials: 'include',
  });
  ```

