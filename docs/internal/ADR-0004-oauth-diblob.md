# ADR-0004: OAuth/OIDC integration via `@speajus/diblob-oauth`

## Status
Proposed

## Date
2025-11-29

## Context / Problem
- Many diblob-based services need standards-based authentication and authorization for:
  - End-user sign-in (web apps, SPAs, mobile backends).
  - Service-to-service calls (API gateways, background workers).
- Today, each service tends to integrate directly with its chosen IdP (Auth0, Cognito, Okta, Azure AD, etc.) using ad hoc helpers.
- There is no canonical diblob package that:
  - Wraps a well-maintained OAuth 2.1 / OpenID Connect client library.
  - Encodes secure defaults (Authorization Code + PKCE, nonce/state validation, HTTPS-only redirect URIs).
  - Provides reusable blobs for token verification and session handling.
  - Plays nicely with `@speajus/diblob-config`, `@speajus/diblob-connect`, and `@speajus/diblob-testing`.
- As a result:
  - Security-sensitive logic (token validation, key rotation, cookie flags) gets re-implemented per app.
  - Testing is harder (network calls to IdPs, brittle mocks).
  - It is easy to accidentally choose weaker flows or store tokens unsafely.

## Goals
- Provide a **first-class OAuth/OIDC package** `@speajus/diblob-oauth` that:
  - Uses a popular, battle-tested library for the protocol details.
  - Encourages **Authorization Code + PKCE** and OIDC ID token validation by default.
  - Provides reusable blobs for:
    - Building authorization URLs.
    - Exchanging authorization codes for tokens.
    - Verifying access/ID tokens for APIs.
    - Managing server-side sessions backed by OAuth tokens.
  - Is easy to configure via `@speajus/diblob-config` and easy to override via `@speajus/diblob-testing`.
- Make secure behavior the **default** and clearly document tradeoffs.

## Non-goals
- Implementing a full identity provider (user database, UI, password reset flows).
- Replacing IdP-hosted login pages or UIs.
- Supporting legacy/unsafe flows (password grant, implicit flow) beyond explicit opt-in for narrow cases.

## Decision
We will introduce a new package **`@speajus/diblob-oauth`** that:

1. Wraps **`openid-client`** as the primary OAuth 2.1 / OIDC client library.
   - `openid-client` is widely used, standards-focused, and actively maintained.
   - It supports discovery, dynamic JWKS fetching, PKCE, and advanced features like mutual TLS when needed.
2. Provides container-centric blobs and registration helpers, for example (names illustrative):
   - `oauthClientConfigBlob` – strongly typed configuration (issuer URL, client id, client secret, redirect URIs, scopes), typically loaded via `@speajus/diblob-config`.
   - `oidcClientBlob` – wraps `openid-client` client instances and exposes high-level methods such as `fetchAuthorizationUrl`, `exchangeAuthorizationCode`, and `refreshTokens`.
   - `accessTokenVerifierBlob` – verifies bearer tokens for APIs using issuer metadata and JWKS (audience, expiry, signature, nonce where applicable).
   - `oauthSessionManagerBlob` – optional server-side session abstraction for web apps (managing encrypted, HttpOnly cookies that reference tokens stored server-side).
3. Ships secure defaults:
   - Authorization Code + PKCE as the primary flow for browser-based clients.
   - HTTPS-only redirect URIs and cookie settings.
   - Strong validation of `iss`, `aud`, `exp`, `nbf`, `nonce`, and `state` where applicable.
   - No logging of raw tokens or secrets; only sanitized identifiers.
4. Integrates with other diblob packages in a first-class way:
   - **Config (`@speajus/diblob-config`)** – Zod-backed schemas and loaders for OAuth settings.
   - **Telemetry (`@speajus/diblob-telemetry`)** – metrics and traces around OAuth flows (token exchanges, verification failures, refreshes).
   - **Logger (`@speajus/diblob-logger`)** – structured logging for authentication events without leaking secrets.
   - **Connect (`@speajus/diblob-connect`)** – middleware helpers for verifying tokens on incoming RPC/HTTP requests and attaching identities to request context.
   - **Testing (`@speajus/diblob-testing`)** – helpers to run against fake issuers and static JWKS for deterministic tests.

## Library choices and alternatives
- **Chosen core library: `openid-client`**
  - Pros:
    - Rich OIDC/OAuth 2.1 support, including discovery and JWKS caching.
    - Actively maintained, widely adopted in Node/TypeScript ecosystems.
    - Focused on protocol correctness rather than web framework opinions.
  - Cons:
    - Low-level in places; we will provide higher-level helpers via blobs.

- **Alternatives considered**
  - **Passport.js**
    - Very popular but centered on Express middleware and “strategy” plugins.
    - Less aligned with diblob’s container-first architecture and RPC-first services.
  - **Auth.js (formerly NextAuth.js)**
    - Excellent for Next.js apps, but tightly coupled to Next.js routing and request lifecycle.
    - Not a good fit as a generic backend library for Node services and gRPC/Connect servers.
  - **Custom minimal client**
    - Too risky for security-sensitive protocol logic compared to established libraries.

Given the above, `openid-client` is the most appropriate foundation for `@speajus/diblob-oauth`.

## Design overview

### Blobs and registrations (illustrative)
- `OAuthClientConfig` interface
  - Issuer URL, client id/secret, redirect URIs, default scopes, token endpoint auth method, clock skew tolerance, etc.
- `oauthClientConfigBlob` and `registerOAuthClientConfigBlob(container, blob, options)`
  - Uses `@speajus/diblob-config` (with Zod schemas) to load and validate `OAuthClientConfig`.
- `oidcClientBlob` and `registerOidcClientBlobs(container, options)`
  - Creates and caches `openid-client` issuer and client instances.
  - Exposes high-level methods like `fetchAuthorizationUrl`, `exchangeAuthorizationCode`, `refreshTokens`.
- `accessTokenVerifierBlob`
  - Verifies JWT access tokens via issuer discovery and JWKS.
  - Enforces audience, issuer, expiry, and optional custom claims.
- `oauthSessionManagerBlob`
  - Manages authentication sessions for web apps.
  - Stores minimal identifiers in encrypted, HttpOnly, SameSite cookies.
  - Keeps tokens server-side to minimize exposure in browsers.

### Testing strategy
- Build on `@speajus/diblob-testing` patterns:
  - Provide `registerTestOAuthBlobs(container, overrides)` that:
    - Uses a fake issuer with static metadata and JWKS served from an in-process HTTP server or in-memory adapter.
    - Returns deterministic access and ID tokens for known test users.
  - Allow overriding time via a controllable clock blob to test expiry and refresh logic.
- All package tests use **node:test**:
  - Flow tests for:
    - Building authorization URLs and preserving state/nonce.
    - Exchanging codes for tokens and handling error responses.
    - Verifying access tokens, including clock skew and key rotation.
  - Security tests for:
    - Rejection of tokens with wrong issuer/audience.
    - Expired/not-yet-valid tokens.
    - Mismatched state and nonce values.

### Security considerations
- **Protocol flows**
  - Prefer Authorization Code + PKCE for browser-based flows.
  - Disallow implicit flow; treat resource-owner password credentials as unsupported by default.
- **Token handling**
  - Never log raw tokens, authorization codes, or client secrets.
  - Encourage server-side storage for tokens, with short-lived access tokens and refresh tokens kept in secure stores.
- **Cookies and sessions**
  - HttpOnly, Secure, and appropriate SameSite flags on cookies.
  - Optional encryption for session cookies using keys from `@speajus/diblob-config`.
- **Key management**
  - Rely on `openid-client` JWKS caching with sensible TTLs, and expose configuration for cache size and refresh.
- **Hardening and upgrades**
  - Pin `openid-client` via semver and monitor security advisories.
  - Document recommended HTTP security headers and rate limiting at the edge (outside this package but relevant to deployments).

## Consequences

### Positive
- Consistent, documented OAuth/OIDC story for diblob-based services.
- Reduced duplication of complex, security-sensitive logic across services.
- Easier, safer testing via deterministic fake issuers and container overrides.
- Clear integration points for Connect handlers, frontends, and CLIs.

### Negative / tradeoffs
- New dependency on a complex third-party library (`openid-client`).
- Additional configuration surface that users must understand (issuer, audiences, redirect URIs, etc.).
- Opinionated defaults (Authorization Code + PKCE, cookie policies) may require overrides for some legacy deployments.

## Implementation plan
1. Create `packages/diblob-oauth` with the standard build/test setup used in other packages.
2. Add `openid-client` as a dependency (via pnpm) and define core types and blob interfaces.
3. Implement `registerOAuthClientConfigBlob`, `registerOidcClientBlobs`, `accessTokenVerifierBlob`, and `oauthSessionManagerBlob` following existing diblob registration patterns.
4. Add node:test-based tests with `@speajus/diblob-testing`, including fake issuers and deterministic tokens.
5. Document usage in public diblob docs (new OAuth/OIDC page) and reference this ADR from internal docs and package README.
6. Add examples in the `examples` folder: a small web app and an API service using `@speajus/diblob-oauth` with a common IdP (e.g., Auth0 or Cognito).

