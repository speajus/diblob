# Async Support

diblob has full support for async factories and async dependency resolution.

## Async Factories

Register a blob with an async factory:

```typescript
container.register(database, async () => {
  const connection = await createConnection();
  return new DatabaseImpl(connection);
});
```

## Resolving Async Blobs

Use `await` with `container.resolve()`:

```typescript
const database = await container.resolve(databaseBlob);
```

Or use the blob directly (it returns a Promise):

```typescript
const result = await databaseBlob.query('SELECT * FROM users');
```

## Async Dependencies

When a blob has async dependencies, the container handles them automatically:

```typescript
// Async blob
container.register(database, async () => {
  await delay(100);
  return new DatabaseImpl();
});

// Service depends on async blob
container.register(userService, UserServiceImpl, database);

// Resolve - automatically waits for database
const service = await container.resolve(userService);
```

## Mixed Sync and Async

You can mix sync and async dependencies:

```typescript
// Sync
container.register(logger, ConsoleLogger);

// Async
container.register(database, async () => {
  const conn = await createConnection();
  return new DatabaseImpl(conn);
});

// Mixed dependencies
container.register(userService, UserServiceImpl, logger, database);

// Resolve - waits for async dependencies
const service = await container.resolve(userService);
```

## Constructor with Async Dependencies

Classes with async blob default parameters work automatically:

```typescript
class MyService {
  constructor(
    private logger = loggerBlob,
    private database = databaseBlob  // async blob
  ) {}
}

// Container detects and resolves async dependencies
const service = await container.resolve(MyService);
```

## Using Async Blobs

### Method Calls

When calling methods on async blobs, use `await`:

```typescript
container.register(database, async () => new DatabaseImpl());

// Method calls return Promises
const users = await database.query('SELECT * FROM users');
```

### Property Access

Property access on async blobs also requires `await`:

```typescript
const config = await database.config;
```

## Error Handling

Handle errors from async factories:

```typescript
container.register(database, async () => {
  try {
    const conn = await createConnection();
    return new DatabaseImpl(conn);
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
});

try {
  const db = await container.resolve(database);
} catch (error) {
  console.error('Failed to resolve database:', error);
}
```

## Async Lifecycle

Async blobs follow the same lifecycle rules:

### Singleton (Default)

The async factory is called once, and the result is cached:

```typescript
container.register(database, async () => {
  console.log('Creating database...');
  return new DatabaseImpl();
});

await database.query('...'); // "Creating database..."
await database.query('...'); // (reuses cached instance)
```

### Transient

The async factory is called every time:

```typescript
import { Lifecycle } from '@speajus/diblob';

container.register(database, async () => {
  console.log('Creating database...');
  return new DatabaseImpl();
}, { lifecycle: Lifecycle.Transient });

await database.query('...'); // "Creating database..."
await database.query('...'); // "Creating database..." (again)
```

## Parallel Resolution

When resolving multiple async blobs, they resolve in parallel:

```typescript
container.register(database, async () => {
  await delay(100);
  return new DatabaseImpl();
});

container.register(cache, async () => {
  await delay(100);
  return new CacheImpl();
});

// Both resolve in parallel (takes ~100ms, not 200ms)
const [db, c] = await Promise.all([
  container.resolve(database),
  container.resolve(cache)
]);
```

## Best Practices

### 1. Use Async for I/O Operations

Use async factories for operations that involve I/O:

```typescript
// ✓ Good - async for database connection
container.register(database, async () => {
  const conn = await createConnection();
  return new DatabaseImpl(conn);
});

// ✗ Avoid - sync for I/O (blocks)
container.register(database, () => {
  const conn = createConnectionSync(); // blocks!
  return new DatabaseImpl(conn);
});
```

### 2. Handle Initialization Errors

Always handle errors in async factories:

```typescript
container.register(database, async () => {
  try {
    return await initializeDatabase();
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
});
```

### 3. Avoid Mixing Sync and Async Unnecessarily

If a blob doesn't need to be async, keep it sync:

```typescript
// ✗ Avoid - unnecessary async
container.register(logger, async () => new ConsoleLogger());

// ✓ Better - keep it sync
container.register(logger, () => new ConsoleLogger());
```

### 4. Use Promise.all for Parallel Initialization

Initialize multiple async blobs in parallel:

```typescript
async function initializeApp() {
  await Promise.all([
    container.resolve(database),
    container.resolve(cache),
    container.resolve(messageQueue)
  ]);
  
  console.log('All services initialized!');
}
```

## Next Steps

- [Container Nesting](/diblob/guide/container-nesting) - Hierarchical containers
- [Lifecycle Management](/diblob/guide/lifecycle) - Control instance lifecycles
- [Constructor Injection](/diblob/guide/constructor-injection) - Default parameters

