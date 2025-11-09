# Visualizer Examples

This page provides examples of using the Diblob Visualizer in different scenarios.

## Example Container Setup

The visualizer includes a reusable example container setup that demonstrates common DI patterns.

### Location

All example code is located in `packages/diblob-visualizer/src/examples/sample-container.ts`

### What's Included

**Interfaces:**
- `Logger` - Logging service
- `Database` - Database access
- `Cache` - Caching service
- `UserService` - User management
- `EmailService` - Email sending
- `NotificationService` - Notification system
- `MetricsService` - Event tracking

**Implementations:**
- `ConsoleLogger` - Simple console-based logger
- `InMemoryDatabase` - Mock database
- `MemoryCache` - In-memory cache (transient lifecycle)
- `UserServiceImpl` - User service with logger, database, and cache dependencies
- `EmailServiceImpl` - Email service with logger dependency
- `NotificationServiceImpl` - Notification service with user, email, and logger dependencies
- `MetricsServiceImpl` - Metrics service with logger dependency

## Usage Examples

### Create a Sample Container

```typescript
import { createSampleContainer } from './examples/sample-container.js';

const container = createSampleContainer();
```

This creates a container with 6 services:
- Logger (singleton)
- Database (singleton)
- Cache (transient)
- UserService (singleton, depends on logger, database, cache)
- EmailService (singleton, depends on logger)
- NotificationService (singleton, depends on userService, emailService, logger)

### Add Metrics Service

```typescript
import { addMetricsService } from './examples/sample-container.js';

addMetricsService(container);
```

This adds a MetricsService to the container.

### Get Blobs for Re-registration

```typescript
import { getLoggerBlob, getLoggerImpl } from './examples/sample-container.js';

const logger = getLoggerBlob();
const ConsoleLogger = getLoggerImpl();

// Re-register to trigger updates
container.register(logger, ConsoleLogger);
```

## Complete Example

Here's a complete example showing how to set up a container with metadata and visualize it:

```typescript
import { createBlob, createContainer } from '@speajus/diblob';

// Define interfaces
interface Logger {
  log(message: string): void;
}

interface Database {
  query(sql: string): unknown[];
}

interface UserService {
  getUser(id: number): { id: number; name: string };
  createUser(name: string): { id: number; name: string };
}

// Create blobs with metadata
const logger = createBlob<Logger>('logger', {
  name: 'Console Logger',
  description: 'Logs messages to the console',
  category: 'infrastructure',
  version: '1.0.0'
});

const database = createBlob<Database>('database', {
  name: 'In-Memory Database',
  description: 'Simple in-memory database for testing',
  category: 'infrastructure',
  version: '1.0.0'
});

const userService = createBlob<UserService>('userService', {
  name: 'User Service',
  description: 'Manages user data and operations',
  category: 'business',
  version: '2.1.0',
  author: 'Development Team'
});

// Implementations
class ConsoleLogger implements Logger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

class InMemoryDatabase implements Database {
  private data: Map<string, unknown[]> = new Map();

  query(sql: string): unknown[] {
    console.log(`[DB] Executing: ${sql}`);
    return this.data.get(sql) || [];
  }
}

class UserServiceImpl implements UserService {
  private users: Map<number, { id: number; name: string }> = new Map();
  private nextId = 1;

  constructor(
    private logger: Logger,
    private database: Database
  ) {}

  getUser(id: number) {
    this.logger.log(`Getting user ${id}`);
    this.database.query(`SELECT * FROM users WHERE id = ${id}`);
    return this.users.get(id) || { id: 0, name: 'Unknown' };
  }

  createUser(name: string) {
    const user = { id: this.nextId++, name };
    this.users.set(user.id, user);
    this.logger.log(`Created user: ${name}`);
    this.database.query(`INSERT INTO users VALUES (${user.id}, '${name}')`);
    return user;
  }
}

// Create container with metadata
const container = createContainer({
  name: 'Application Container',
  description: 'Main DI container for the application',
  environment: 'development',
  created: new Date().toISOString()
});

// Register services
container.register(logger, ConsoleLogger);
container.register(database, InMemoryDatabase);
container.register(userService, UserServiceImpl, logger, database);
```

Then visualize it:

```svelte
<script lang="ts">
  import { DiblobVisualizer } from '@speajus/diblob-visualizer';
  import { container } from './container';
</script>

<DiblobVisualizer {container} autoRefresh={true} />
```

## Used By

- `src/App.svelte` - Demo application (local mode)
- `example-server.ts` - Example server for remote visualization

## Benefits

1. **DRY Principle** - Example code is defined once and reused
2. **Consistency** - Both local and remote demos use the same setup
3. **Maintainability** - Changes to examples only need to be made in one place
4. **Clean Separation** - Demo code is separate from component code

