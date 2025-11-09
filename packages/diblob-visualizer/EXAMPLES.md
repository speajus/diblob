# Example Container Setup

The @speajus/diblob-visualizer includes a reusable example container setup that demonstrates common DI patterns.

## Location

All example code is located in `src/examples/sample-container.ts`

## What's Included

### Interfaces
- `Logger` - Logging service
- `Database` - Database access
- `Cache` - Caching service
- `UserService` - User management
- `EmailService` - Email sending
- `NotificationService` - Notification system
- `MetricsService` - Event tracking

### Implementations
- `ConsoleLogger` - Simple console-based logger
- `InMemoryDatabase` - Mock database
- `MemoryCache` - In-memory cache (transient lifecycle)
- `UserServiceImpl` - User service with logger, database, and cache dependencies
- `EmailServiceImpl` - Email service with logger dependency
- `NotificationServiceImpl` - Notification service with user, email, and logger dependencies
- `MetricsServiceImpl` - Metrics service with logger dependency

## Usage

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

## Used By

- `src/App.svelte` - Demo application (local mode)
- `example-server.ts` - Example server for remote visualization

## Benefits

1. **DRY Principle** - Example code is defined once and reused
2. **Consistency** - Both local and remote demos use the same setup
3. **Maintainability** - Changes to examples only need to be made in one place
4. **Clean Separation** - Demo code is separate from component code

## Customization

To create your own example container:

1. Define your interfaces
2. Implement your classes
3. Create a factory function that returns a configured container
4. Export helper functions for dynamic modifications

Example:

```typescript
export function createMyContainer(): Container {
  const myBlob = createBlob<MyService>('myService');
  const container = createContainer();
  container.register(myBlob, MyServiceImpl);
  return container;
}
```

## File Structure

```
@speajus/diblob-visualizer/
├── src/
│   ├── examples/
│   │   └── sample-container.ts    # Reusable example setup
│   ├── App.svelte                 # Uses sample-container
│   └── lib/
│       ├── DiblobVisualizer.svelte
│       └── RemoteDiblobVisualizer.svelte
├── example-server.ts              # Uses sample-container
└── ...
```

