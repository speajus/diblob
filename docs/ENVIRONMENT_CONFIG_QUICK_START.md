# Environment Configuration - Quick Start

## TL;DR

Here are the most common patterns for injecting environment variables into your diblob container:

## Pattern 1: Configuration Blob (Recommended)

**Best for**: Most applications with structured configuration

```typescript
import { createBlob, createContainer } from '@speajus/diblob';

// 1. Define your config interface
interface AppConfig {
  database: { host: string; port: number };
  api: { baseUrl: string; apiKey: string };
}

// 2. Create config blob
const config = createBlob<AppConfig>();

// 3. Register config with environment values
const container = createContainer();
container.register(config, () => ({
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10)
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://api.example.com',
    apiKey: process.env.API_KEY || ''
  }
}));

// 4. Services depend on config
const dbService = createBlob<DatabaseService>();
container.register(dbService, (cfg: AppConfig) => 
  new DatabaseService(cfg.database.host, cfg.database.port), config);
```

## Pattern 2: Direct Injection

**Best for**: Simple cases with few config values

```typescript
const dbService = createBlob<DatabaseService>();
const container = createContainer();

// Pass environment values directly as dependencies
container.register(
  dbService,
  (host: string, port: number) => new DatabaseService(host, port),
  process.env.DB_HOST || 'localhost',
  parseInt(process.env.DB_PORT || '5432', 10)
);
```

## Pattern 3: Config Service

**Best for**: Dynamic configuration or lazy loading

```typescript
interface ConfigService {
  get(key: string): string | undefined;
  getInt(key: string, defaultValue?: number): number;
}

const configService = createBlob<ConfigService>();
container.register(configService, () => ({
  get: (key: string) => process.env[key],
  getInt: (key: string, defaultValue = 0) => {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
  }
}));

// Services use config service
container.register(dbService, (cfg: ConfigService) => {
  const host = cfg.get('DB_HOST') || 'localhost';
  const port = cfg.getInt('DB_PORT', 5432);
  return new DatabaseService(host, port);
}, configService);
```

## Testing with Mock Configuration

### Option A: Mock the Service

**Easiest approach** - just mock the service you want to test:

```typescript
const testContainer = createContainer(productionContainer);

// Mock the service directly
testContainer.register(dbService, () => ({
  query: async (sql: string) => '[MOCK] ' + sql
}));
```

### Option B: Override Config (requires re-registering services)

```typescript
const testContainer = createContainer(productionContainer);

// 1. Override config
testContainer.register(config, () => ({
  database: { host: 'localhost', port: 5433 },
  api: { baseUrl: 'http://localhost:3000', apiKey: 'test-key' }
}));

// 2. Re-register services to use new config
testContainer.register(dbService, (cfg: AppConfig) => 
  new DatabaseService(cfg.database.host, cfg.database.port), config);
```

**Important**: You must re-register services when overriding config because services in the parent container have already captured the parent's config reference.

## Using .env Files

Install dotenv:

```bash
npm install dotenv
```

Load environment variables at startup:

```typescript
import { config as loadEnv } from 'dotenv';

// Load .env file
loadEnv();

// Now process.env has values from .env
const container = createContainer();
container.register(config, loadConfig);
```

Create `.env` file:

```bash
# .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
API_BASE_URL=https://api.example.com
API_KEY=your-api-key-here
```

Create `.env.example` for documentation:

```bash
# .env.example
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
API_BASE_URL=https://api.example.com
API_KEY=
```

## Validation

Always validate required configuration at startup:

```typescript
function loadConfig(): AppConfig {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY environment variable is required');
  }

  const port = parseInt(process.env.PORT || '3000', 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
  }

  return {
    port,
    apiKey,
    // ... rest of config
  };
}

container.register(config, loadConfig);
```

## Complete Example

```typescript
import { createBlob, createContainer } from '@speajus/diblob';
import { config as loadEnv } from 'dotenv';

// Load .env file
loadEnv();

// Define interfaces
interface AppConfig {
  server: { port: number; host: string };
  database: { url: string };
}

interface DatabaseService {
  connect(): Promise<void>;
}

interface ApiService {
  start(): Promise<void>;
}

// Load and validate config
function loadConfig(): AppConfig {
  const port = parseInt(process.env.PORT || '3000', 10);
  if (Number.isNaN(port)) {
    throw new Error('Invalid PORT');
  }

  return {
    server: {
      port,
      host: process.env.HOST || '0.0.0.0'
    },
    database: {
      url: process.env.DATABASE_URL || 'postgresql://localhost/mydb'
    }
  };
}

// Create blobs
const config = createBlob<AppConfig>();
const dbService = createBlob<DatabaseService>();
const apiService = createBlob<ApiService>();

// Setup container
const container = createContainer();

container.register(config, loadConfig);

container.register(dbService, (cfg: AppConfig) => ({
  connect: async () => {
    console.log(`Connecting to ${cfg.database.url}`);
  }
}), config);

container.register(apiService, (cfg: AppConfig, db: DatabaseService) => ({
  start: async () => {
    await db.connect();
    console.log(`Server starting on ${cfg.server.host}:${cfg.server.port}`);
  }
}), config, dbService);

// Start application
const api = await container.resolve(apiService);
await api.start();
```

## See Also

- [Full Environment Configuration Guide](./ENVIRONMENT_CONFIGURATION.md)
- [examples/environment-config.ts](../examples/environment-config.ts)
- [examples/environment-config-testing.ts](../examples/environment-config-testing.ts)

