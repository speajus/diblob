# Async Dependencies Example

Working with async factories and async dependencies.

## Complete Example

```typescript
import { createBlob, createContainer } from '@speajus/diblob';

// Interfaces
interface Database {
  query(sql: string): Promise<any[]>;
  close(): Promise<void>;
}

interface Cache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

interface UserService {
  getUser(id: number): Promise<User>;
}

interface User {
  id: number;
  name: string;
}

// Implementations
class DatabaseImpl implements Database {
  private connected = false;
  
  constructor(private connectionString: string) {}
  
  async connect() {
    console.log(`Connecting to ${this.connectionString}...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
    console.log('Connected!');
  }
  
  async query(sql: string): Promise<any[]> {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    console.log(`Executing: ${sql}`);
    return [{ id: 1, name: 'Alice' }];
  }
  
  async close() {
    this.connected = false;
    console.log('Connection closed');
  }
}

class RedisCache implements Cache {
  async connect() {
    console.log('Connecting to Redis...');
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log('Redis connected!');
  }
  
  async get(key: string): Promise<string | null> {
    console.log(`Cache GET: ${key}`);
    return null; // Cache miss
  }
  
  async set(key: string, value: string): Promise<void> {
    console.log(`Cache SET: ${key} = ${value}`);
  }
}

class UserServiceImpl implements UserService {
  constructor(
    private database: Database,
    private cache: Cache
  ) {}
  
  async getUser(id: number): Promise<User> {
    // Try cache first
    const cached = await this.cache.get(`user:${id}`);
    if (cached) {
      console.log('Cache hit!');
      return JSON.parse(cached);
    }
    
    // Query database
    const users = await this.database.query(`SELECT * FROM users WHERE id = ${id}`);
    const user = users[0];
    
    // Store in cache
    await this.cache.set(`user:${id}`, JSON.stringify(user));
    
    return user;
  }
}

// Create blobs
const database = createBlob<Database>();
const cache = createBlob<Cache>();
const userService = createBlob<UserService>();

// Create container
const container = createContainer();

// Register with async factories
container.register(database, async () => {
  const db = new DatabaseImpl('postgresql://localhost/mydb');
  await db.connect();
  return db;
});

container.register(cache, async () => {
  const c = new RedisCache();
  await c.connect();
  return c;
});

container.register(userService, UserServiceImpl, database, cache);

// Use async blobs
async function main() {
  console.log('Starting application...\n');
  
  // First call - cache miss
  const user1 = await userService.getUser(1);
  console.log(`User: ${user1.name}\n`);
  
  // Second call - cache hit
  const user2 = await userService.getUser(1);
  console.log(`User: ${user2.name}\n`);
  
  // Cleanup
  await database.close();
}

main();
```

## Output

```
Starting application...

Connecting to postgresql://localhost/mydb...
Connected!
Connecting to Redis...
Redis connected!
Cache GET: user:1
Executing: SELECT * FROM users WHERE id = 1
Cache SET: user:1 = {"id":1,"name":"Alice"}
User: Alice

Cache GET: user:1
Cache hit!
User: Alice

Connection closed
```

## Key Points

1. **Async factories** - Use `async () => { ... }` for async initialization
2. **Automatic resolution** - Container waits for async dependencies
3. **Use await** - Call `await` when using async blobs
4. **Parallel resolution** - Multiple async blobs resolve in parallel

## Next Steps

- [Reactive Updates](/examples/reactive) - Re-registering implementations
- [Container Nesting](/examples/nesting) - Parent and child containers

