# Lifecycle Hooks

diblob supports lifecycle hooks that allow you to run code when instances are created or destroyed.

## Initialize Hook

The `initialize` hook is called after an instance is created. This is useful for:
- Setting up resources
- Establishing connections
- Running startup logic

### Using a Method Name

```typescript
import { Lifecycle } from '@speajus/diblob';

interface Database {
  initialize(): void | Promise<void>;
  query(sql: string): any;
}

class DatabaseImpl implements Database {
  async initialize() {
    console.log('Connecting to database...');
    // Establish connection
  }

  query(sql: string) {
    // Execute query
  }
}

container.register(database, DatabaseImpl, {
  lifecycle: Lifecycle.Singleton,
  initialize: 'initialize'
});

// When resolved, initialize() is called automatically
const db = await container.resolve(database);
```

### Using a Function

You can also use a function that receives the instance as a parameter:

```typescript
import { Lifecycle } from '@speajus/diblob';

container.register(database, DatabaseImpl, {
  lifecycle: Lifecycle.Singleton,
  initialize: async (instance: DatabaseImpl) => {
    console.log('Connecting to database...');
    await instance.connect();
  }
});
```

This is useful when you want to perform initialization logic outside of the class itself.

### Async Initialize

Initialize hooks can be async:

```typescript
import { Lifecycle } from '@speajus/diblob';

class DatabaseImpl implements Database {
  async initialize() {
    await this.connect();
    await this.runMigrations();
  }
}

container.register(database, DatabaseImpl, {
  lifecycle: Lifecycle.Singleton,
  initialize: 'initialize'
});
```

## Dispose Hook

The `dispose` hook is called when an instance is invalidated (e.g., when re-registering). This is useful for:
- Cleaning up resources
- Closing connections
- Releasing locks

### Using a Method Name

```typescript
import { Lifecycle } from '@speajus/diblob';

interface Database {
  dispose(): void | Promise<void>;
  query(sql: string): any;
}

class DatabaseImpl implements Database {
  async dispose() {
    console.log('Closing database connection...');
    // Close connection
  }

  query(sql: string) {
    // Execute query
  }
}

container.register(database, DatabaseImpl, {
  lifecycle: Lifecycle.Singleton,
  dispose: 'dispose'
});

// When re-registered, dispose() is called on the old instance
container.register(database, DatabaseImpl, {
  lifecycle: Lifecycle.Singleton,
  dispose: 'dispose'
});
```

### Using a Function

You can also use a function that receives the instance as a parameter:

```typescript
import { Lifecycle } from '@speajus/diblob';

container.register(database, DatabaseImpl, {
  lifecycle: Lifecycle.Singleton,
  dispose: async (instance: DatabaseImpl) => {
    console.log('Closing database connection...');
    await instance.close();
  }
});
```

This is useful when you want to perform cleanup logic outside of the class itself.

### Cascading Disposal

When a blob is invalidated, all its dependents are also disposed:

```typescript
import { Lifecycle } from '@speajus/diblob';

container.register(logger, LoggerImpl, {
  lifecycle: Lifecycle.Singleton,
  dispose: 'dispose'
});

container.register(service, ServiceImpl, logger, {
  lifecycle: Lifecycle.Singleton,
  dispose: 'dispose'
});

// Re-registering logger will dispose both logger AND service
container.register(logger, LoggerImpl, {
  lifecycle: Lifecycle.Singleton,
  dispose: 'dispose'
});
```

## Combining Hooks

You can use both initialize and dispose together:

```typescript
import { Lifecycle } from '@speajus/diblob';

container.register(database, DatabaseImpl, {
  lifecycle: Lifecycle.Singleton,
  initialize: 'initialize',
  dispose: 'dispose'
});
```

**Note**: Including the `lifecycle` property helps TypeScript discriminate the options type correctly. While you can omit it (singleton is the default), it's recommended to include it for better type inference.

## Lifecycle Interactions

### Singleton Lifecycle

For singletons, initialize is called once when the instance is first created, and dispose is called when the instance is invalidated:

```typescript
container.register(database, DatabaseImpl, {
  lifecycle: Lifecycle.Singleton,
  initialize: 'initialize',
  dispose: 'dispose'
});

await database.query('...'); // Calls initialize
await database.query('...'); // Reuses instance

container.register(database, DatabaseImpl, { /* ... */ }); // Calls dispose
```

### Transient Lifecycle

For transient instances, initialize is called for each new instance. Dispose is not typically useful for transient instances since they're not cached:

```typescript
import { Lifecycle } from '@speajus/diblob';

container.register(logger, LoggerImpl, {
  lifecycle: Lifecycle.Transient,
  initialize: 'initialize'
});

logger.log('A'); // Creates instance, calls initialize
logger.log('B'); // Creates NEW instance, calls initialize again
```

## See Also

- [Lifecycle Management](/diblob/guide/lifecycle) - Singleton vs Transient lifecycles
- [Reactive Dependencies](/diblob/guide/reactive-dependencies) - How invalidation works
- [API Reference](/diblob/api/types#registrationoptions) - RegistrationOptions type

