/**
 * Examples of injecting environment variables and configuration into the container
 */

import { createBlob, createContainer } from '../src';

// ============================================================================
// Approach 1: Direct Plain Value Injection
// ============================================================================
console.log('=== Approach 1: Direct Plain Value Injection ===\n');

interface DatabaseService {
  connect(): string;
}

const dbService = createBlob<DatabaseService>();
const container1 = createContainer();

// Register with environment variables as plain values
container1.register(
  dbService,
  (host: string, port: number, dbName: string) => ({
    connect: () => `Connected to ${dbName} at ${host}:${port}`
  }),
  process.env.DB_HOST || 'localhost',
  parseInt(process.env.DB_PORT || '5432'),
  process.env.DB_NAME || 'mydb'
);

const db1 = await container1.resolve(dbService);
console.log(db1.connect());
console.log();

// ============================================================================
// Approach 2: Configuration Blob Pattern
// ============================================================================
console.log('=== Approach 2: Configuration Blob Pattern ===\n');

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

interface ApiService {
  fetch(endpoint: string): string;
}

const config = createBlob<Config>();
const apiService = createBlob<ApiService>();
const container2 = createContainer();

// Register configuration blob
container2.register(config, () => ({
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

// Register service that depends on config
container2.register(apiService, (cfg: Config) => ({
  fetch: (endpoint: string) => 
    `Fetching ${cfg.api.baseUrl}${endpoint} (timeout: ${cfg.api.timeout}ms)`
}), config);

const api = await container2.resolve(apiService);
console.log(api.fetch('/users'));
console.log();

// ============================================================================
// Approach 3: Typed Configuration Service
// ============================================================================
console.log('=== Approach 3: Typed Configuration Service ===\n');

interface ConfigService {
  get(key: string): string | undefined;
  getRequired(key: string): string;
  getInt(key: string, defaultValue?: number): number;
  getBool(key: string, defaultValue?: boolean): boolean;
}

interface EmailService {
  send(to: string, subject: string): string;
}

const configService = createBlob<ConfigService>();
const emailService = createBlob<EmailService>();
const container3 = createContainer();

// Register configuration service
container3.register(configService, () => ({
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
    return value ? parseInt(value) : defaultValue;
  },
  
  getBool: (key: string, defaultValue = false) => {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  }
}));

// Register service that uses config service
container3.register(emailService, (cfg: ConfigService) => ({
  send: (to: string, subject: string) => {
    const smtpHost = cfg.get('SMTP_HOST') || 'smtp.example.com';
    const smtpPort = cfg.getInt('SMTP_PORT', 587);
    const useTls = cfg.getBool('SMTP_TLS', true);
    
    return `Sending email to ${to} via ${smtpHost}:${smtpPort} (TLS: ${useTls})`;
  }
}), configService);

const email = await container3.resolve(emailService);
console.log(email.send('user@example.com', 'Hello'));
console.log();

// ============================================================================
// Approach 4: Environment-Specific Configuration
// ============================================================================
console.log('=== Approach 4: Environment-Specific Configuration ===\n');

interface Logger {
  log(message: string): void;
  level: string;
}

const logger = createBlob<Logger>();
const container4 = createContainer();

const env = process.env.NODE_ENV || 'development';

// Register different implementations based on environment
if (env === 'production') {
  container4.register(logger, () => ({
    level: 'error',
    log: (message: string) => console.log(`[PROD ERROR] ${message}`)
  }));
} else {
  container4.register(logger, () => ({
    level: 'debug',
    log: (message: string) => console.log(`[DEV DEBUG] ${message}`)
  }));
}

const log = await container4.resolve(logger);
console.log(`Logger level: ${log.level}`);
log.log('Application started');
console.log();

// ============================================================================
// Approach 5: Validated Configuration with Defaults
// ============================================================================
console.log('=== Approach 5: Validated Configuration with Defaults ===\n');

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

interface AppService {
  start(): string;
}

const appConfig = createBlob<AppConfig>();
const appService = createBlob<AppService>();
const container5 = createContainer();

// Helper function to validate and parse config
function loadConfig(): AppConfig {
  const port = parseInt(process.env.PORT || '3000');
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
  }

  return {
    port,
    host: process.env.HOST || '0.0.0.0',
    database: {
      url: process.env.DATABASE_URL || 'postgresql://localhost/mydb',
      poolSize: parseInt(process.env.DB_POOL_SIZE || '10')
    },
    features: {
      enableCache: process.env.ENABLE_CACHE === 'true',
      enableMetrics: process.env.ENABLE_METRICS !== 'false' // default true
    }
  };
}

// Register validated config
container5.register(appConfig, loadConfig);

// Register service that uses config
container5.register(appService, (cfg: AppConfig) => ({
  start: () => {
    const features = [];
    if (cfg.features.enableCache) features.push('cache');
    if (cfg.features.enableMetrics) features.push('metrics');

    return `Server starting on ${cfg.host}:${cfg.port} with features: ${features.join(', ')}`;
  }
}), appConfig);

const app = await container5.resolve(appService);
console.log(app.start());
console.log();

// ============================================================================
// Approach 6: Secrets Management Pattern
// ============================================================================
console.log('=== Approach 6: Secrets Management Pattern ===\n');

interface SecretsManager {
  getSecret(key: string): Promise<string>;
}

interface PaymentService {
  processPayment(amount: number): Promise<string>;
}

const secretsManager = createBlob<SecretsManager>();
const paymentService = createBlob<PaymentService>();
const container6 = createContainer();

// Register async secrets manager
container6.register(secretsManager, async () => {
  // In production, this might fetch from AWS Secrets Manager, Vault, etc.
  // For demo, we'll use environment variables
  return {
    getSecret: async (key: string) => {
      // Simulate async secret retrieval
      await new Promise(resolve => setTimeout(resolve, 10));
      return process.env[key] || `secret-${key}`;
    }
  };
});

// Register service that uses secrets
container6.register(paymentService, (secrets: SecretsManager) => ({
  processPayment: async (amount: number) => {
    const apiKey = await secrets.getSecret('PAYMENT_API_KEY');
    return `Processing $${amount} with API key: ${apiKey.substring(0, 10)}...`;
  }
}), secretsManager);

const payment = await container6.resolve(paymentService);
console.log(await payment.processPayment(100));
console.log();

