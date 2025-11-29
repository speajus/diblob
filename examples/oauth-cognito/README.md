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

Configure these environment variables before running the example:

- `COGNITO_ISSUER_URL` – your user pool issuer URL, for example
  `https://cognito-idp.<region>.amazonaws.com/<user-pool-id>`
- `COGNITO_CLIENT_ID` – the app client ID
- `COGNITO_CLIENT_SECRET` – the app client secret (if configured)
- `COGNITO_REDIRECT_URI` – redirect URI that matches the app client settings,
  for example `http://localhost:3000/callback`

## Running the example

From the repo root:

```sh
pnpm --filter diblob-oauth-cognito-example dev
```

Then open `http://localhost:3000/login` in your browser.

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

