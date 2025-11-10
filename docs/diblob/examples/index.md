# Examples

Practical examples of using diblob.

## Basic Examples

- [Basic Usage](/diblob/examples/basic) - Simple logger and service example
- [Factory Injection](/diblob/examples/factory-injection) - Injecting dependencies into factory functions
- [Async Dependencies](/diblob/examples/async) - Working with async factories
- [Reactive Updates](/diblob/examples/reactive) - Re-registering implementations
- [Container Nesting](/diblob/examples/nesting) - Parent and child containers

## Common Patterns

### Simple Service

```typescript
import { createBlob, createContainer } from '@speajus/diblob';

interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

const logger = createBlob<Logger>();
const container = createContainer();

container.register(logger, ConsoleLogger);
logger.log('Hello, world!');
```

### Service with Dependencies

```typescript
interface UserService {
  getUser(id: number): User;
}

class UserServiceImpl implements UserService {
  constructor(
    private logger: Logger,
    private database: Database
  ) {}
  
  getUser(id: number): User {
    this.logger.log(`Fetching user ${id}`);
    return this.database.query(`SELECT * FROM users WHERE id = ${id}`)[0];
  }
}

const userService = createBlob<UserService>();
container.register(userService, UserServiceImpl, logger, database);

const user = userService.getUser(123);
```

### Async Factory

```typescript
const database = createBlob<Database>();

container.register(database, async () => {
  const connection = await createConnection();
  return new DatabaseImpl(connection);
});

const result = await database.query('SELECT * FROM users');
```

### Constructor Injection

```typescript
class MyService {
  constructor(
    private logger = loggerBlob,
    private database = databaseBlob
  ) {}

  async doSomething() {
    this.logger.log('Starting...');
    const data = await this.database.query('...');
    return data;
  }
}

const service = await container.resolve(MyService);
await service.doSomething();
```

### Factory Injection

```typescript
interface Service {
  doWork(): void;
}

const service = createBlob<Service>();

// Factory receives injected dependencies as parameters
container.register(service, (log: Logger, db: Database) => ({
  doWork: () => {
    log.log('Working...');
    db.query('SELECT * FROM tasks');
  }
}), logger, database);

service.doWork();
```

## Next Steps

Explore the detailed examples:
- [Basic Usage](/diblob/examples/basic)
- [Factory Injection](/diblob/examples/factory-injection)
- [Async Dependencies](/diblob/examples/async)
- [Reactive Updates](/diblob/examples/reactive)
- [Container Nesting](/diblob/examples/nesting)

