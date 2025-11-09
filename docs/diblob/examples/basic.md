# Basic Usage Example

A complete example showing basic diblob usage.

## Complete Example

```typescript
import { createBlob, createContainer } from '@speajus/diblob';

// 1. Define interfaces
interface Logger {
  log(message: string): void;
  error(message: string): void;
}

interface Database {
  query(sql: string): any[];
}

interface UserService {
  getUser(id: number): User;
  createUser(name: string): User;
}

interface User {
  id: number;
  name: string;
}

// 2. Implement classes
class ConsoleLogger implements Logger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
  
  error(message: string) {
    console.error(`[ERROR] ${message}`);
  }
}

class InMemoryDatabase implements Database {
  private users: User[] = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ];
  
  query(sql: string): any[] {
    console.log(`Executing: ${sql}`);
    // Simplified query logic
    if (sql.includes('SELECT')) {
      return this.users;
    }
    return [];
  }
  
  insert(user: User) {
    this.users.push(user);
  }
}

class UserServiceImpl implements UserService {
  constructor(
    private logger: Logger,
    private database: Database
  ) {}
  
  getUser(id: number): User {
    this.logger.log(`Fetching user ${id}`);
    const users = this.database.query(`SELECT * FROM users WHERE id = ${id}`);
    
    if (users.length === 0) {
      this.logger.error(`User ${id} not found`);
      throw new Error(`User ${id} not found`);
    }
    
    return users[0];
  }
  
  createUser(name: string): User {
    this.logger.log(`Creating user ${name}`);
    const user = { id: Date.now(), name };
    (this.database as InMemoryDatabase).insert(user);
    return user;
  }
}

// 3. Create blobs
const logger = createBlob<Logger>();
const database = createBlob<Database>();
const userService = createBlob<UserService>();

// 4. Create container and register
const container = createContainer();

container.register(logger, ConsoleLogger);
container.register(database, InMemoryDatabase);
container.register(userService, UserServiceImpl, logger, database);

// 5. Use the blobs
const user1 = userService.getUser(1);
console.log(`Found user: ${user1.name}`);

const newUser = userService.createUser('Charlie');
console.log(`Created user: ${newUser.name}`);

const user2 = userService.getUser(newUser.id);
console.log(`Retrieved new user: ${user2.name}`);
```

## Output

```
[LOG] Fetching user 1
Executing: SELECT * FROM users WHERE id = 1
Found user: Alice
[LOG] Creating user Charlie
Created user: Charlie
[LOG] Fetching user 1234567890
Executing: SELECT * FROM users WHERE id = 1234567890
Retrieved new user: Charlie
```

## Key Points

1. **Define interfaces** - Clear contracts for your services
2. **Create blobs** - One blob per interface
3. **Register implementations** - Associate blobs with classes
4. **Use blobs directly** - No need to call `container.resolve()`

## Next Steps

- [Async Dependencies](/diblob/examples/async) - Working with async
- [Reactive Updates](/diblob/examples/reactive) - Re-registering implementations

