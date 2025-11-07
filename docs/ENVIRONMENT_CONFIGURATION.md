# Environment Configuration Guide

This guide explains different approaches for injecting environment variables and configuration into the diblob container.

## Table of Contents

1. [Direct Plain Value Injection](#1-direct-plain-value-injection)
2. [Configuration Blob Pattern](#2-configuration-blob-pattern)
3. [Typed Configuration Service](#3-typed-configuration-service)
4. [Environment-Specific Configuration](#4-environment-specific-configuration)
5. [Validated Configuration](#5-validated-configuration)
6. [Secrets Management](#6-secrets-management)
7. [Best Practices](#best-practices)

## 1. Direct Plain Value Injection

The simplest approach - pass environment variables directly as plain values.

```typescript
import { createBlob, createContainer } from '@speajus/diblob';

interface DatabaseService {
  connect(): string;
}

const dbService = createBlob<DatabaseService>();
const container = createContainer();

// Register with environment variables as plain values
container.register(
  dbService,
  (host: string, port: number, dbName: string) => ({
    connect: () => `Connected to ${dbName} at ${host}:${port}`
  }),
  process.env.DB_HOST || 'localhost',
  parseInt(process.env.DB_PORT || '5432'),
  process.env.DB_NAME || 'mydb'
);

const db = await container.resolve(dbService);
console.log(db.connect());
```

**Pros:**
- Simple and straightforward
- No extra abstractions
- Good for small number of config values

**Cons:**
- Can become verbose with many config values
- No centralized configuration
- Harder to test

## 2. Configuration Blob Pattern

Create a dedicated configuration blob that other services depend on.

```typescript
interface Config {
  database: {
    host: string;
    port: number;
    name: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
}

const config = createBlob<Config>();
const apiService = createBlob<ApiService>();
const container = createContainer();

// Register configuration blob
container.register(config, () => ({
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'mydb'
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://api.example.com',
    timeout: parseInt(process.env.API_TIMEOUT || '5000')
  }
}));

// Services depend on config
container.register(apiService, (cfg: Config) => ({
  fetch: (endpoint: string) => 
    `Fetching ${cfg.api.baseUrl}${endpoint}`
}), config);
```

**Pros:**
- Centralized configuration
- Easy to mock in tests
- Type-safe configuration access
- Single source of truth

**Cons:**
- All config loaded at once
- May include unused config

## 3. Typed Configuration Service

Create a service that provides typed access to environment variables.

```typescript
interface ConfigService {
  get(key: string): string | undefined;
  getRequired(key: string): string;
  getInt(key: string, defaultValue?: number): number;
  getBool(key: string, defaultValue?: boolean): boolean;
}

const configService = createBlob<ConfigService>();
const container = createContainer();

container.register(configService, () => ({
  get: (key: string) => process.env[key],
  
  getRequired: (key: string) => {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  },
  
  getInt: (key: string, defaultValue = 0) => {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
  },
  
  getBool: (key: string, defaultValue = false) => {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  }
}));

// Services use config service
container.register(emailService, (cfg: ConfigService) => ({
  send: (to: string) => {
    const smtpHost = cfg.get('SMTP_HOST') || 'smtp.example.com';
    const smtpPort = cfg.getInt('SMTP_PORT', 587);
    // ...
  }
}), configService);
```

**Pros:**
- Lazy loading of config values
- Type conversion helpers
- Validation at access time
- Flexible and extensible

**Cons:**
- Less type-safe (string keys)
- Errors occur at runtime
- Harder to see all config dependencies

## 4. Environment-Specific Configuration

Register different implementations based on the environment.

```typescript
const logger = createBlob<Logger>();
const container = createContainer();

const env = process.env.NODE_ENV || 'development';

if (env === 'production') {
  container.register(logger, () => ({
    level: 'error',
    log: (message: string) => console.log(`[PROD] ${message}`)
  }));
} else {
  container.register(logger, () => ({
    level: 'debug',
    log: (message: string) => console.log(`[DEV] ${message}`)
  }));
}
```

**Pros:**
- Different behavior per environment
- Clean separation of concerns
- Easy to understand

**Cons:**
- Requires conditional logic
- Can lead to code duplication

## 5. Validated Configuration

Validate and parse configuration with proper error handling.

```typescript
interface AppConfig {
  port: number;
  host: string;
  database: {
    url: string;
    poolSize: number;
  };
  features: {
    enableCache: boolean;
    enableMetrics: boolean;
  };
}

function loadConfig(): AppConfig {
  const port = parseInt(process.env.PORT || '3000', 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
  }

  return {
    port,
    host: process.env.HOST || '0.0.0.0',
    database: {
      url: process.env.DATABASE_URL || 'postgresql://localhost/mydb',
      poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10)
    },
    features: {
      enableCache: process.env.ENABLE_CACHE === 'true',
      enableMetrics: process.env.ENABLE_METRICS !== 'false'
    }
  };
}

const appConfig = createBlob<AppConfig>();
container.register(appConfig, loadConfig);
```

**Pros:**
- Early validation (fail fast)
- Type-safe configuration
- Clear error messages
- Centralized validation logic

**Cons:**
- More boilerplate
- All config validated at startup

## 6. Secrets Management

Handle sensitive configuration with async secret retrieval.

```typescript
interface SecretsManager {
  getSecret(key: string): Promise<string>;
}

const secretsManager = createBlob<SecretsManager>();
const container = createContainer();

// Register async secrets manager
container.register(secretsManager, async () => {
  // In production, fetch from AWS Secrets Manager, Vault, etc.
  return {
    getSecret: async (key: string) => {
      // Simulate async secret retrieval
      const response = await fetch(`https://secrets-api.com/${key}`);
      return response.text();
    }
  };
});

// Services use secrets manager
container.register(paymentService, (secrets: SecretsManager) => ({
  processPayment: async (amount: number) => {
    const apiKey = await secrets.getSecret('PAYMENT_API_KEY');
    // Use apiKey...
  }
}), secretsManager);
```

**Pros:**
- Secure secret handling
- Supports external secret stores
- Async retrieval
- Secrets not in environment variables

**Cons:**
- More complex setup
- Requires async handling
- Potential performance impact

## Best Practices

### 1. Use Type-Safe Configuration

Always define interfaces for your configuration:

```typescript
interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}
```

### 2. Provide Sensible Defaults

```typescript
const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info'
};
```

### 3. Validate Early

Validate configuration at startup, not at runtime:

```typescript
function validateConfig(config: Config): void {
  if (!config.database.url) {
    throw new Error('DATABASE_URL is required');
  }
  if (config.port < 1 || config.port > 65535) {
    throw new Error('PORT must be between 1 and 65535');
  }
}

container.register(appConfig, () => {
  const config = loadConfig();
  validateConfig(config);
  return config;
});
```

### 4. Use Environment-Specific Files

Consider using `.env` files with a library like `dotenv`:

```typescript
import { config as loadEnv } from 'dotenv';

// Load .env file
loadEnv();

// Now process.env has values from .env
const appConfig = createBlob<AppConfig>();
container.register(appConfig, loadConfig);
```

### 5. Separate Secrets from Config

Keep secrets separate from regular configuration:

```typescript
// Regular config - can be logged
const config = createBlob<Config>();

// Secrets - never log
const secrets = createBlob<SecretsManager>();

// Services depend on both
container.register(dbService, (cfg: Config, sec: SecretsManager) => ({
  connect: async () => {
    const password = await sec.getSecret('DB_PASSWORD');
    return connectToDb(cfg.database.host, password);
  }
}), config, secrets);
```

### 6. Make Configuration Testable

Use container nesting to override config in tests. **Important**: When you override configuration, you must also re-register any services that depend on it:

```typescript
// Production container
const prodContainer = createContainer();
prodContainer.register(config, loadConfig);
prodContainer.register(dbService, (cfg: Config) =>
  new DatabaseService(cfg.database), config);

// Test container with mock config
const testContainer = createContainer(prodContainer);

// Override config
testContainer.register(config, () => ({
  database: { host: 'localhost', port: 5432 },
  api: { baseUrl: 'http://localhost:3000' }
}));

// Re-register services to use the new config
testContainer.register(dbService, (cfg: Config) =>
  new DatabaseService(cfg.database), config);
```

**Why re-register?** When a service is registered in the parent container with a dependency on `config`, it captures that specific config blob reference. Simply overriding the config in the child container doesn't automatically update the service's dependencies - you need to re-register the service in the child container to use the new config.

**Alternative**: Mock the entire service instead of just the config:

```typescript
const testContainer = createContainer(prodContainer);

// Instead of overriding config, mock the service directly
testContainer.register(dbService, () => ({
  query: async (sql: string) => '[MOCK] ' + sql
}));
```

### 7. Document Required Variables

Create a `.env.example` file:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp

# API Configuration
API_BASE_URL=https://api.example.com
API_TIMEOUT=5000

# Feature Flags
ENABLE_CACHE=true
ENABLE_METRICS=true
```

## Example: Complete Application Setup

```typescript
import { createBlob, createContainer } from '@speajus/diblob';

// 1. Define configuration interface
interface AppConfig {
  server: { port: number; host: string };
  database: { url: string };
  features: { cache: boolean };
}

// 2. Create configuration loader
function loadConfig(): AppConfig {
  return {
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0'
    },
    database: {
      url: process.env.DATABASE_URL || 'postgresql://localhost/mydb'
    },
    features: {
      cache: process.env.ENABLE_CACHE === 'true'
    }
  };
}

// 3. Create blobs
const config = createBlob<AppConfig>();
const dbService = createBlob<DatabaseService>();
const apiService = createBlob<ApiService>();

// 4. Setup container
const container = createContainer();

container.register(config, loadConfig);
container.register(dbService, (cfg: AppConfig) =>
  new DatabaseService(cfg.database.url), config);
container.register(apiService, (cfg: AppConfig, db: DatabaseService) =>
  new ApiService(cfg.server, db), config, dbService);

// 5. Start application
const api = await container.resolve(apiService);
await api.start();
```

## See Also

- [examples/environment-config.ts](../examples/environment-config.ts) - Complete working examples
- [Container Nesting](/guide/container-nesting) - Override config in tests
- [Async Resolution](/guide/async-support) - Async configuration loading

