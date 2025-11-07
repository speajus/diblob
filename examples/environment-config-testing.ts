/**
 * Example: Testing with Environment Configuration
 * 
 * This demonstrates how to test services that depend on environment configuration
 * by using container nesting to override configuration in tests.
 */

import { createBlob, createContainer } from '../src';

// ============================================================================
// Application Code
// ============================================================================

interface Config {
  database: {
    host: string;
    port: number;
  };
  api: {
    baseUrl: string;
    apiKey: string;
  };
}

interface DatabaseService {
  query(sql: string): Promise<string>;
}

interface ApiClient {
  fetch(endpoint: string): Promise<string>;
}

// Configuration loader (reads from environment)
function loadProductionConfig(): Config {
  return {
    database: {
      host: process.env.DB_HOST || 'prod-db.example.com',
      port: parseInt(process.env.DB_PORT || '5432', 10)
    },
    api: {
      baseUrl: process.env.API_BASE_URL || 'https://api.example.com',
      apiKey: process.env.API_KEY || 'prod-key-123'
    }
  };
}

// Create blobs
const config = createBlob<Config>();
const dbService = createBlob<DatabaseService>();
const apiClient = createBlob<ApiClient>();

// Production container setup
const productionContainer = createContainer();

productionContainer.register(config, loadProductionConfig);

productionContainer.register(dbService, (cfg: Config) => ({
  query: async (sql: string) => {
    return `Executing "${sql}" on ${cfg.database.host}:${cfg.database.port}`;
  }
}), config);

productionContainer.register(apiClient, (cfg: Config) => ({
  fetch: async (endpoint: string) => {
    return `Fetching ${cfg.api.baseUrl}${endpoint} with key ${cfg.api.apiKey}`;
  }
}), config);

// ============================================================================
// Test Setup
// ============================================================================

console.log('=== Production Configuration ===\n');

const prodDb = await productionContainer.resolve(dbService);
const prodApi = await productionContainer.resolve(apiClient);

console.log(await prodDb.query('SELECT * FROM users'));
console.log(await prodApi.fetch('/users'));
console.log();

// ============================================================================
// Test 1: Override Configuration with Mock Values
// ============================================================================

console.log('=== Test 1: Mock Configuration (WRONG - services still use parent config) ===\n');

// Create test container that inherits from production
const testContainer1 = createContainer(productionContainer);

// Override config with test values
// NOTE: This doesn't work as expected because dbService and apiService
// are still registered in the parent with the parent's config
testContainer1.register(config, () => ({
  database: {
    host: 'localhost',
    port: 5433
  },
  api: {
    baseUrl: 'http://localhost:3000',
    apiKey: 'test-key'
  }
}));

const testDb1 = await testContainer1.resolve(dbService);
const testApi1 = await testContainer1.resolve(apiClient);

console.log(await testDb1.query('SELECT * FROM users'));
console.log(await testApi1.fetch('/users'));
console.log();

// ============================================================================
// Test 1b: Correct Way - Re-register Services
// ============================================================================

console.log('=== Test 1b: Correct Configuration Override ===\n');

const testContainer1b = createContainer(productionContainer);

// Override config
testContainer1b.register(config, () => ({
  database: {
    host: 'localhost',
    port: 5433
  },
  api: {
    baseUrl: 'http://localhost:3000',
    apiKey: 'test-key'
  }
}));

// Re-register services to use the new config
testContainer1b.register(dbService, (cfg: Config) => ({
  query: async (sql: string) => {
    return `Executing "${sql}" on ${cfg.database.host}:${cfg.database.port}`;
  }
}), config);

testContainer1b.register(apiClient, (cfg: Config) => ({
  fetch: async (endpoint: string) => {
    return `Fetching ${cfg.api.baseUrl}${endpoint} with key ${cfg.api.apiKey}`;
  }
}), config);

const testDb1b = await testContainer1b.resolve(dbService);
const testApi1b = await testContainer1b.resolve(apiClient);

console.log(await testDb1b.query('SELECT * FROM users'));
console.log(await testApi1b.fetch('/users'));
console.log();

// ============================================================================
// Test 2: Partial Configuration Override
// ============================================================================

console.log('=== Test 2: Partial Override ===\n');

const testContainer2 = createContainer(productionContainer);

// Override only the database config
testContainer2.register(config, () => ({
  database: {
    host: 'test-db.local',
    port: 5432
  },
  api: {
    baseUrl: 'https://api.example.com', // Keep production value
    apiKey: 'test-api-key' // Override this
  }
}));

const testDb2 = await testContainer2.resolve(dbService);
const testApi2 = await testContainer2.resolve(apiClient);

console.log(await testDb2.query('SELECT * FROM test_users'));
console.log(await testApi2.fetch('/test'));
console.log();

// ============================================================================
// Test 3: Mock Entire Service
// ============================================================================

console.log('=== Test 3: Mock Service ===\n');

const testContainer3 = createContainer(productionContainer);

// Instead of overriding config, mock the entire service
testContainer3.register(dbService, () => ({
  query: async (sql: string) => {
    return `[MOCK] Query: ${sql}`;
  }
}));

const testDb3 = await testContainer3.resolve(dbService);
console.log(await testDb3.query('SELECT * FROM users'));
console.log();

// ============================================================================
// Test 4: Environment-Specific Test Container
// ============================================================================

console.log('=== Test 4: Test Environment Container ===\n');

function loadTestConfig(): Config {
  return {
    database: {
      host: 'localhost',
      port: 5433
    },
    api: {
      baseUrl: 'http://localhost:3000',
      apiKey: 'test-key-456'
    }
  };
}

const testContainer4 = createContainer();
testContainer4.register(config, loadTestConfig);
testContainer4.register(dbService, (cfg: Config) => ({
  query: async (sql: string) => {
    return `[TEST ENV] Executing "${sql}" on ${cfg.database.host}:${cfg.database.port}`;
  }
}), config);

const testDb4 = await testContainer4.resolve(dbService);
console.log(await testDb4.query('SELECT * FROM users'));
console.log();

