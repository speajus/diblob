# Examples

Practical examples of using diblob.

## Basic Examples

- [Basic Usage](/examples/basic) - Simple logger and service example
- [Async Dependencies](/examples/async) - Working with async factories
- [Reactive Updates](/examples/reactive) - Re-registering implementations
- [Container Nesting](/examples/nesting) - Parent and child containers

## Common Patterns

### Simple Service

```typescript
import { createBlob, createContainer } from 'diblob';

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

## Next Steps

Explore the detailed examples:
- [Basic Usage](/examples/basic)
- [Async Dependencies](/examples/async)
- [Reactive Updates](/examples/reactive)
- [Container Nesting](/examples/nesting)

