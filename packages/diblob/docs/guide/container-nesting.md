# Container Nesting

diblob supports container nesting and merging for flexible dependency management.

## Creating Child Containers

Create a child container that inherits from a parent:

```typescript
const parent = createContainer();
parent.register(logger, ConsoleLogger);

const child = createContainer(parent);
child.register(database, DatabaseImpl);

// child can resolve both logger and database
await child.resolve(logger);    // ✓ from parent
await child.resolve(database);  // ✓ from child

// parent can only resolve logger
await parent.resolve(logger);   // ✓ from parent
await parent.resolve(database); // ✗ Error: not registered
```

## Overriding Parent Registrations

Child containers can override parent registrations:

```typescript
const parent = createContainer();
parent.register(logger, ConsoleLogger);

const child = createContainer(parent);
child.register(logger, FileLogger); // Override

// child uses FileLogger
await child.resolve(logger); // FileLogger

// parent still uses ConsoleLogger
await parent.resolve(logger); // ConsoleLogger
```

## Merging Multiple Containers

Merge multiple containers by passing them all to `createContainer()`:

```typescript
const c1 = createContainer();
c1.register(logger, ConsoleLogger);

const c2 = createContainer();
c2.register(database, DatabaseImpl);

const merged = createContainer(c1, c2);

// merged can resolve from both
await merged.resolve(logger);   // from c1
await merged.resolve(database); // from c2
```

### Conflict Resolution

When merging, the last parent wins for conflicts:

```typescript
const c1 = createContainer();
c1.register(logger, ConsoleLogger);

const c2 = createContainer();
c2.register(logger, FileLogger);

const merged = createContainer(c1, c2);

// c2 is last, so FileLogger wins
await merged.resolve(logger); // FileLogger
```

## Use Cases

### 1. Application Scopes

Create containers for different scopes:

```typescript
// Application-level container
const appContainer = createContainer();
appContainer.register(config, ConfigService);
appContainer.register(logger, LoggerService);

// Request-level container
function handleRequest(req) {
  const requestContainer = createContainer(appContainer);
  requestContainer.register(requestContext, () => new RequestContext(req));
  
  // Request-specific services can access both app and request blobs
  requestContainer.register(userService, UserService, logger, requestContext);
}
```

### 2. Testing

Override production services with test doubles:

```typescript
// Production container
const prodContainer = createContainer();
prodContainer.register(database, ProductionDatabase);
prodContainer.register(emailService, SendGridEmailService);

// Test container
const testContainer = createContainer(prodContainer);
testContainer.register(database, MockDatabase);
testContainer.register(emailService, MockEmailService);

// Tests use mocks, production uses real services
```

### 3. Feature Modules

Organize features into separate containers:

```typescript
// Core module
const coreContainer = createContainer();
coreContainer.register(logger, LoggerService);
coreContainer.register(config, ConfigService);

// User module
const userContainer = createContainer();
userContainer.register(userService, UserService);
userContainer.register(userRepository, UserRepository);

// Payment module
const paymentContainer = createContainer();
paymentContainer.register(paymentService, PaymentService);
paymentContainer.register(paymentGateway, StripeGateway);

// App container merges all modules
const appContainer = createContainer(coreContainer, userContainer, paymentContainer);
```

### 4. Multi-Tenancy

Create tenant-specific containers:

```typescript
const baseContainer = createContainer();
baseContainer.register(logger, LoggerService);

function getTenantContainer(tenantId: string) {
  const tenantContainer = createContainer(baseContainer);
  tenantContainer.register(database, () => new TenantDatabase(tenantId));
  tenantContainer.register(config, () => new TenantConfig(tenantId));
  return tenantContainer;
}

const tenant1 = getTenantContainer('tenant-1');
const tenant2 = getTenantContainer('tenant-2');
```

## Dependency Resolution Order

When resolving a blob, the container searches in this order:
1. Own registrations
2. Parent registrations (in reverse order - last parent first)

```typescript
const c1 = createContainer();
c1.register(logger, ConsoleLogger);

const c2 = createContainer();
c2.register(logger, FileLogger);

const child = createContainer(c1, c2);
child.register(database, DatabaseImpl);

// Resolution order:
// 1. child's own registrations
// 2. c2 (last parent)
// 3. c1 (first parent)
```

## Best Practices

### 1. Keep Hierarchies Shallow

Avoid deep nesting:

```typescript
// ✗ Avoid - too deep
const c1 = createContainer();
const c2 = createContainer(c1);
const c3 = createContainer(c2);
const c4 = createContainer(c3);

// ✓ Better - flatter structure
const base = createContainer();
const child1 = createContainer(base);
const child2 = createContainer(base);
```

### 2. Use Nesting for Scopes

Use child containers for scoped lifetimes:

```typescript
// App scope
const appContainer = createContainer();

// Request scope
app.use((req, res, next) => {
  req.container = createContainer(appContainer);
  next();
});
```

### 3. Use Merging for Modules

Use merging to combine independent modules:

```typescript
const authModule = createAuthContainer();
const dataModule = createDataContainer();
const apiModule = createApiContainer();

const app = createContainer(authModule, dataModule, apiModule);
```

## Next Steps

- [Lifecycle Management](/guide/lifecycle) - Control instance lifecycles
- [Constructor Injection](/guide/constructor-injection) - Default parameters

