import { type OAuthSessionManager, oauthSessionManager } from './blobs.js';

// Placeholder module for future session store implementations (e.g., in-memory,
// Redis, database-backed). For now we only export the blob type and let
// applications register their own concrete implementation.

export { oauthSessionManager };
export type { OAuthSessionManager };
