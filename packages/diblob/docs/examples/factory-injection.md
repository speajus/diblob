# Factory Injection Examples

This page demonstrates practical examples of using factory function dependency injection in diblob.

## Basic Service with Logger

```typescript
import { createBlob, createContainer } from '@speajus/diblob';

interface Logger {
  log(msg: string): void;
}

interface UserService {
  createUser(name: string): void;
}

const logger = createBlob<Logger>();
const userService = createBlob<UserService>();
const container = createContainer();

// Register logger
container.register(logger, () => ({
  log: (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`)
}));

// Register service with injected logger
container.register(userService, (log: Logger) => ({
  createUser: (name: string) => {
    log.log(`Creating user: ${name}`);
    // ... create user logic
  }
}), logger);

// Use the service
userService.createUser('Alice');
```

## Repository Pattern

```typescript
interface Database {
  query(sql: string): Promise<any[]>;
}

interface UserRepository {
  findById(id: number): Promise<User>;
  save(user: User): Promise<void>;
}

class UserRepositoryImpl implements UserRepository {
  constructor(
    private db: Database,
    private logger: Logger
  ) {}
  
  async findById(id: number): Promise<User> {
    this.logger.log(`Finding user ${id}`);
    const rows = await this.db.query(`SELECT * FROM users WHERE id = ${id}`);
    return rows[0];
  }
  
  async save(user: User): Promise<void> {
    this.logger.log(`Saving user ${user.id}`);
    await this.db.query(`INSERT INTO users ...`);
  }
}

const database = createBlob<Database>();
const userRepo = createBlob<UserRepository>();

container.register(database, async () => {
  const db = new DatabaseImpl();
  await db.connect();
  return db;
});

container.register(userRepo, (db: Database, log: Logger) => {
  return new UserRepositoryImpl(db, log);
}, database, logger);
```

## API Client with Configuration

```typescript
interface Config {
  getApiUrl(): string;
  getTimeout(): number;
  getApiKey(): string;
}

interface ApiClient {
  get(path: string): Promise<any>;
  post(path: string, data: any): Promise<any>;
}

class ApiClientImpl implements ApiClient {
  constructor(
    private baseUrl: string,
    private timeout: number,
    private apiKey: string,
    private logger: Logger
  ) {}
  
  async get(path: string): Promise<any> {
    this.logger.log(`GET ${this.baseUrl}${path}`);
    // ... fetch logic
  }
  
  async post(path: string, data: any): Promise<any> {
    this.logger.log(`POST ${this.baseUrl}${path}`);
    // ... fetch logic
  }
}

const config = createBlob<Config>();
const apiClient = createBlob<ApiClient>();

container.register(config, () => ({
  getApiUrl: () => process.env.API_URL || 'https://api.example.com',
  getTimeout: () => 5000,
  getApiKey: () => process.env.API_KEY || ''
}));

container.register(apiClient, (cfg: Config, log: Logger) => {
  return new ApiClientImpl(
    cfg.getApiUrl(),
    cfg.getTimeout(),
    cfg.getApiKey(),
    log
  );
}, config, logger);
```

## Conditional Factory Logic

```typescript
interface EmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

class ProductionEmailService implements EmailService {
  async send(to: string, subject: string, body: string): Promise<void> {
    // Send real email via SMTP
  }
}

class DevelopmentEmailService implements EmailService {
  constructor(private logger: Logger) {}
  
  async send(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`[DEV] Email to ${to}: ${subject}`);
    // Don't send real email in development
  }
}

const emailService = createBlob<EmailService>();

container.register(emailService, (cfg: Config, log: Logger) => {
  if (cfg.getEnv() === 'production') {
    return new ProductionEmailService();
  } else {
    return new DevelopmentEmailService(log);
  }
}, config, logger);
```

## Service with Async Initialization

```typescript
interface CacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

class RedisCacheService implements CacheService {
  private client: any;
  
  constructor(
    private host: string,
    private port: number,
    private logger: Logger
  ) {}
  
  async connect(): Promise<void> {
    this.logger.log(`Connecting to Redis at ${this.host}:${this.port}`);
    // ... connect to Redis
  }
  
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }
  
  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }
}

const cacheService = createBlob<CacheService>();

container.register(cacheService, async (cfg: Config, log: Logger) => {
  const cache = new RedisCacheService(
    cfg.getRedisHost(),
    cfg.getRedisPort(),
    log
  );
  await cache.connect();
  return cache;
}, config, logger);

// Use with await since it's async
const cache = await container.resolve(cacheService);
```

## Multi-Layer Architecture

```typescript
// Data Layer
interface UserRepository {
  findById(id: number): Promise<User>;
}

// Business Layer
interface UserService {
  getUser(id: number): Promise<User>;
  updateUser(user: User): Promise<void>;
}

// Presentation Layer
interface UserController {
  handleGetUser(req: Request): Promise<Response>;
}

const userRepo = createBlob<UserRepository>();
const userService = createBlob<UserService>();
const userController = createBlob<UserController>();

// Register data layer
container.register(userRepo, (db: Database, log: Logger) => {
  return new UserRepositoryImpl(db, log);
}, database, logger);

// Register business layer
container.register(userService, (repo: UserRepository, log: Logger) => ({
  async getUser(id: number) {
    log.log(`Getting user ${id}`);
    return await repo.findById(id);
  },
  async updateUser(user: User) {
    log.log(`Updating user ${user.id}`);
    // ... validation and business logic
    await repo.save(user);
  }
}), userRepo, logger);

// Register presentation layer
container.register(userController, (svc: UserService, log: Logger) => ({
  async handleGetUser(req: Request) {
    try {
      const userId = parseInt(req.params.id);
      const user = await svc.getUser(userId);
      return { status: 200, body: user };
    } catch (error) {
      log.log(`Error: ${error.message}`);
      return { status: 500, body: { error: 'Internal Server Error' } };
    }
  }
}), userService, logger);
```

## Testing with Factory Injection

Factory injection makes testing easier by allowing you to inject mock dependencies:

```typescript
// Production setup
container.register(userService, (repo: UserRepository, log: Logger) => {
  return new UserServiceImpl(repo, log);
}, userRepo, logger);

// Test setup
const testContainer = createContainer();
const mockRepo = createBlob<UserRepository>();
const mockLogger = createBlob<Logger>();

testContainer.register(mockRepo, () => ({
  findById: async (id: number) => ({ id, name: 'Test User' }),
  save: async (user: User) => {}
}));

testContainer.register(mockLogger, () => ({
  log: (msg: string) => {} // Silent logger for tests
}));

testContainer.register(userService, (repo: UserRepository, log: Logger) => {
  return new UserServiceImpl(repo, log);
}, mockRepo, mockLogger);

// Run tests
const service = await testContainer.resolve(userService);
const user = await service.getUser(1);
assert.equal(user.name, 'Test User');
```

