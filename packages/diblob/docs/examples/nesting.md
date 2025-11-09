# Container Nesting Example

Using parent and child containers.

## Complete Example

```typescript
import { createBlob, createContainer } from '@speajus/diblob';

// Interfaces
interface Logger {
  log(message: string): void;
}

interface Config {
  apiUrl: string;
}

interface RequestContext {
  requestId: string;
  userId: number;
}

interface UserService {
  getUser(): string;
}

// Implementations
class AppLogger implements Logger {
  log(message: string) {
    console.log(`[APP] ${message}`);
  }
}

class RequestLogger implements Logger {
  constructor(private context: RequestContext) {}
  
  log(message: string) {
    console.log(`[REQUEST ${this.context.requestId}] User ${this.context.userId}: ${message}`);
  }
}

class AppConfig implements Config {
  apiUrl = 'https://api.example.com';
}

class UserServiceImpl implements UserService {
  constructor(
    private logger: Logger,
    private config: Config,
    private context: RequestContext
  ) {}
  
  getUser(): string {
    this.logger.log(`Fetching user from ${this.config.apiUrl}`);
    return `User ${this.context.userId}`;
  }
}

// Create blobs
const logger = createBlob<Logger>();
const config = createBlob<Config>();
const requestContext = createBlob<RequestContext>();
const userService = createBlob<UserService>();

// Application-level container
console.log('=== Setting up Application Container ===');
const appContainer = createContainer();
appContainer.register(logger, AppLogger);
appContainer.register(config, AppConfig);

// Test app-level logger
logger.log('Application started');

// Request 1
console.log('\n=== Handling Request 1 ===');
const request1Container = createContainer(appContainer);
request1Container.register(requestContext, () => ({ requestId: 'req-001', userId: 123 }));
request1Container.register(logger, RequestLogger, requestContext); // Override logger
request1Container.register(userService, UserServiceImpl, logger, config, requestContext);

const user1 = userService.getUser();
console.log(`Result: ${user1}`);

// Request 2
console.log('\n=== Handling Request 2 ===');
const request2Container = createContainer(appContainer);
request2Container.register(requestContext, () => ({ requestId: 'req-002', userId: 456 }));
request2Container.register(logger, RequestLogger, requestContext); // Override logger
request2Container.register(userService, UserServiceImpl, logger, config, requestContext);

const user2 = userService.getUser();
console.log(`Result: ${user2}`);

// App-level logger still works
console.log('\n=== Back to Application Level ===');
logger.log('All requests completed');
```

## Output

```
=== Setting up Application Container ===
[APP] Application started

=== Handling Request 1 ===
[REQUEST req-001] User 123: Fetching user from https://api.example.com
Result: User 123

=== Handling Request 2 ===
[REQUEST req-002] User 456: Fetching user from https://api.example.com
Result: User 456

=== Back to Application Level ===
[APP] All requests completed
```

## Key Points

1. **Inheritance** - Child containers inherit parent registrations
2. **Overriding** - Child can override parent registrations
3. **Isolation** - Each child has its own scope
4. **Shared services** - Common services in parent, specific in child

## Use Cases

### Request Scoping

```typescript
const appContainer = createContainer();
// Register app-level services

app.use((req, res, next) => {
  req.container = createContainer(appContainer);
  // Register request-specific services
  next();
});
```

### Testing

```typescript
const prodContainer = createContainer();
// Production services

const testContainer = createContainer(prodContainer);
// Override with mocks
```

### Multi-Tenancy

```typescript
const baseContainer = createContainer();
// Shared services

function getTenantContainer(tenantId: string) {
  const container = createContainer(baseContainer);
  // Tenant-specific services
  return container;
}
```

## Next Steps

- [Basic Usage](/examples/basic) - Simple examples
- [Async Dependencies](/examples/async) - Working with async

