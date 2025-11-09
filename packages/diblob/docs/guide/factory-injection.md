# Factory Function Dependency Injection

Factory functions in diblob can receive blob dependencies as parameters, which are automatically resolved by the container when the factory is invoked. This provides a powerful and flexible way to create instances with dependencies.

## Basic Usage

### Single Dependency

The simplest case is a factory function that receives a single blob dependency:

```typescript
import { createBlob, createContainer } from '@speajus/diblob';

interface Logger {
  log(msg: string): void;
}

interface Service {
  doWork(): void;
}

const logger = createBlob<Logger>();
const service = createBlob<Service>();
const container = createContainer();

// Register logger
container.register(logger, () => ({
  log: (msg: string) => console.log(`[LOG] ${msg}`)
}));

// Register service with logger dependency injected into factory
container.register(service, (log: Logger) => ({
  doWork: () => log.log('working')
}), logger);

// Use the service
service.doWork(); // Outputs: [LOG] working
```

### Multiple Dependencies

Factory functions can receive multiple blob dependencies:

```typescript
interface Config {
  getEnv(): string;
}

const config = createBlob<Config>();

container.register(config, () => ({
  getEnv: () => 'production'
}));

container.register(service, (log: Logger, cfg: Config) => ({
  start: () => log.log(`Starting in ${cfg.getEnv()}`)
}), logger, config);

service.start(); // Outputs: [LOG] Starting in production
```

### Mixed Dependencies

You can mix blob dependencies with plain values:

```typescript
container.register(service, (log: Logger, env: string, port: number) => ({
  getMessage: () => log.log(`${env}:${port}`)
}), logger, 'production', 8080);

service.getMessage(); // Outputs: [LOG] production:8080
```

## Creating Class Instances

Factory functions are perfect for creating class instances with injected dependencies:

```typescript
class ServiceImpl implements Service {
  constructor(
    private logger: Logger,
    private database: Database
  ) {}
  
  async findUser(id: number) {
    this.logger.log(`Finding user ${id}`);
    return await this.database.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}

container.register(service, (log: Logger, db: Database) => {
  return new ServiceImpl(log, db);
}, logger, database);
```

## Async Factories

Factory functions can be async and still receive injected dependencies:

```typescript
container.register(service, async (log: Logger, db: Database) => {
  // Perform async initialization
  await db.connect();
  log.log('Database connected');
  
  return new ServiceImpl(log, db);
}, logger, database);

// Use with await
const instance = await container.resolve(service);
```

## Async Dependencies

If a dependency is async (registered with an async factory), the container automatically handles it:

```typescript
// Register async logger
container.register(logger, async () => {
  const config = await fetchConfig();
  return new LoggerImpl(config);
});

// Factory receives the resolved logger
container.register(service, (log: Logger) => ({
  work: () => log.log('working')
}), logger);

// Resolution is async when dependencies are async
const instance = await container.resolve(service);
```

## Conditional Logic

Factory functions can use dependencies to make decisions:

```typescript
interface Config {
  isDevelopment(): boolean;
}

container.register(logger, (cfg: Config) => {
  if (cfg.isDevelopment()) {
    return new VerboseLogger();
  } else {
    return new ProductionLogger();
  }
}, config);
```

## Lifecycle Support

Factory injection works with both singleton and transient lifecycles:

```typescript
import { Lifecycle } from '@speajus/diblob';

// Transient factory with injected dependency
container.register(service, (log: Logger) => ({
  id: Math.random(),
  work: () => log.log('working')
}), logger, { lifecycle: Lifecycle.Transient });

// Each resolution creates a new instance
const s1 = await container.resolve(service);
const s2 = await container.resolve(service);
// s1.id !== s2.id
```

## Comparison with Constructor Injection

There are two main ways to inject dependencies in diblob:

### Constructor Injection (Default Parameters)

```typescript
class MyService {
  constructor(private logger = loggerBlob) {}
}

container.register(service, MyService);
```

**Pros:**
- Concise syntax
- Works with class constructors
- Automatic detection of blob dependencies

**Cons:**
- Only works with blobs as default parameters
- Less flexible for conditional logic

### Factory Injection

```typescript
container.register(service, (log: Logger) => new MyService(log), logger);
```

**Pros:**
- Works with any factory function
- Supports conditional logic
- Can mix blobs and plain values
- More explicit about dependencies

**Cons:**
- Slightly more verbose
- Requires listing dependencies twice (in factory signature and as arguments)

## Best Practices

1. **Use TypeScript types**: Type your factory parameters for better IDE support and type safety.

2. **Keep factories simple**: Factory functions should focus on creating instances, not complex business logic.

3. **Prefer constructor injection for simple cases**: Use default parameters when you just need to pass blobs to a constructor.

4. **Use factory injection for complex initialization**: When you need conditional logic, async setup, or mixing blob and plain dependencies.

5. **Be consistent**: Choose one pattern and stick with it within a module or feature.

## Common Patterns

### Repository Pattern

```typescript
container.register(userRepo, (db: Database, log: Logger) => {
  return new UserRepository(db, log);
}, database, logger);
```

### Service with Configuration

```typescript
container.register(apiClient, (cfg: Config, log: Logger) => {
  return new ApiClient(cfg.getApiUrl(), cfg.getTimeout(), log);
}, config, logger);
```

### Factory with Validation

```typescript
container.register(service, (cfg: Config) => {
  if (!cfg.isValid()) {
    throw new Error('Invalid configuration');
  }
  return new ServiceImpl(cfg);
}, config);
```

