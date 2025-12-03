import { createRequire } from 'node:module';
import type DatabaseClass from 'better-sqlite3';

/**
 * Thin wrapper around the better-sqlite3 native driver.
 *
 * It loads the native module lazily and tolerates environments where
 * the compiled binary is not compatible with the current Node.js
 * version (e.g. NODE_MODULE_VERSION mismatch). In that case,
 * `isSqliteAvailable` returns false and callers can skip DB-backed
 * tests instead of crashing the whole test run.
 */

const require = createRequire(import.meta.url);

type SqliteConstructor = typeof DatabaseClass;

let cachedDatabase: SqliteConstructor | null = null;
let cachedError: unknown | null = null;

function loadDatabase(): SqliteConstructor | null {
  if (cachedDatabase || cachedError) {
    return cachedDatabase;
  }

  try {
    const loaded = require('better-sqlite3') as SqliteConstructor;

    // Probe the native binding with a trivial in-memory database to ensure
    // the compiled binary is compatible with the current Node runtime.
    // This mirrors the behavior in the end-to-end test, but centralizes
    // the logic so other tests can cheaply detect incompatibility.
    try {
      const probe = new loaded(':memory:');
      probe.close();
    } catch (error) {
      cachedError = error;
      return null;
    }

    cachedDatabase = loaded;
  } catch (error) {
    cachedError = error;
  }

  return cachedDatabase;
}

/**
 * Returns true when the better-sqlite3 native module can be loaded
 * in the current Node.js runtime.
 */
export function isSqliteAvailable(): boolean {
  return loadDatabase() !== null;
}

/**
 * Returns the better-sqlite3 constructor or throws a descriptive
 * error if the native module failed to load.
 */
export function getSqliteConstructorOrThrow(): SqliteConstructor {
  const db = loadDatabase();

  if (!db) {
    const error = new Error(
      'better-sqlite3 failed to load. This usually means the native module was compiled for a different Node.js version. '
      + 'Reinstall dependencies with the current Node version or skip the example-grpc-server database tests.',
    );

    if (cachedError && typeof cachedError === 'object') {
      (error as any).cause = cachedError;
    }

    throw error;
  }

  return db;
}

export type SqliteDatabase = InstanceType<SqliteConstructor>;

