# Reactive Updates Example

Demonstrating reactive dependency updates.

## Complete Example

```typescript
import { createBlob, createContainer } from 'diblob';

// Interfaces
interface Logger {
  log(message: string): void;
}

interface NotificationService {
  notify(message: string): void;
}

// Implementations
class ConsoleLogger implements Logger {
  log(message: string) {
    console.log(`[CONSOLE] ${message}`);
  }
}

class FileLogger implements Logger {
  log(message: string) {
    console.log(`[FILE] Writing to log.txt: ${message}`);
  }
}

class NotificationServiceImpl implements NotificationService {
  constructor(private logger: Logger) {}
  
  notify(message: string) {
    this.logger.log(`Sending notification: ${message}`);
    // Send notification logic...
  }
}

// Create blobs
const logger = createBlob<Logger>();
const notificationService = createBlob<NotificationService>();

// Create container
const container = createContainer();

// Initial registration
console.log('=== Initial Setup ===');
container.register(logger, ConsoleLogger);
container.register(notificationService, NotificationServiceImpl, logger);

notificationService.notify('Welcome!');
notificationService.notify('You have a new message');

// Re-register logger with different implementation
console.log('\n=== Switching to File Logger ===');
container.register(logger, FileLogger);

// notificationService automatically uses the new logger!
notificationService.notify('System update available');
notificationService.notify('Backup completed');

// Switch back
console.log('\n=== Switching back to Console Logger ===');
container.register(logger, ConsoleLogger);

notificationService.notify('All done!');
```

## Output

```
=== Initial Setup ===
[CONSOLE] Sending notification: Welcome!
[CONSOLE] Sending notification: You have a new message

=== Switching to File Logger ===
[FILE] Writing to log.txt: Sending notification: System update available
[FILE] Writing to log.txt: Sending notification: Backup completed

=== Switching back to Console Logger ===
[CONSOLE] Sending notification: All done!
```

## Key Points

1. **Automatic updates** - Dependents automatically use new implementations
2. **No manual wiring** - No need to update references manually
3. **Cascading updates** - Changes propagate through dependency graph
4. **Lazy re-resolution** - Instances are re-created on next access

## Use Cases

### Feature Flags

```typescript
if (featureFlags.useNewLogger) {
  container.register(logger, NewLogger);
} else {
  container.register(logger, OldLogger);
}
```

### Environment-Specific

```typescript
if (process.env.NODE_ENV === 'production') {
  container.register(emailService, SendGridService);
} else {
  container.register(emailService, MockEmailService);
}
```

### Hot Reloading

```typescript
watchFiles(['./services/**/*.ts'], (file) => {
  const newImpl = require(file).default;
  container.register(serviceBlob, newImpl);
});
```

## Next Steps

- [Container Nesting](/examples/nesting) - Parent and child containers
- [Basic Usage](/examples/basic) - Simple examples

