# Containers

The **Container** is responsible for managing blob registrations and resolving dependencies.

## Creating a Container

Use `createContainer()` to create a new container:

```typescript
import { createContainer } from 'diblob';

const container = createContainer();
```

## Registering Blobs

The `register()` method associates a blob with its implementation:

```typescript
container.register(blob, factory, ...dependencies);
```

### With a Constructor

```typescript
class ConsoleLogger implements Logger {
  log(message: string) {
    console.log(message);
  }
}

container.register(logger, ConsoleLogger);
```

### With a Factory Function

```typescript
container.register(logger, () => new ConsoleLogger());
```

### With Dependencies

Dependencies can be blobs or plain values:

```typescript
// Blob dependencies
container.register(userService, UserServiceImpl, logger, database);

// Mix of blobs and plain values
container.register(apiClient, ApiClient, logger, "https://api.example.com", 3000);
```

The container automatically detects which arguments are blobs and resolves them.

### With Lifecycle Options

```typescript
import { Lifecycle } from 'diblob';

// Singleton (default)
container.register(logger, ConsoleLogger);

// Transient - new instance each time
container.register(logger, ConsoleLogger, { lifecycle: Lifecycle.Transient });
```

## Resolving Dependencies

### Automatic Resolution (Recommended)

Just use the blob directly:

```typescript
container.register(logger, ConsoleLogger);

// Use it directly!
logger.log('Hello');
```

### Manual Resolution

You can manually resolve a blob if needed:

```typescript
const loggerInstance = container.resolve(logger);
loggerInstance.log('Hello');
```

### Resolving Classes with Blob Dependencies

The container can resolve classes that use blobs as default parameters:

```typescript
class MyService {
  constructor(private logger = loggerBlob) {}
}

// Automatically detects and resolves the blob dependency
const service = await container.resolve(MyService);
```

## Checking Registrations

Check if a blob is registered:

```typescript
if (container.has(logger)) {
  console.log('Logger is registered');
}
```

## Unregistering Blobs

Remove a blob registration:

```typescript
container.unregister(logger);
```

When you unregister a blob, all dependents are invalidated and will need to be re-resolved.

## Clearing the Container

Remove all registrations:

```typescript
container.clear();
```

## Container Nesting

Create child containers that inherit from parent containers:

```typescript
const parent = createContainer();
parent.register(sharedBlob, SharedImpl);

const child = createContainer(parent);
child.register(childBlob, ChildImpl);

// child can resolve both sharedBlob and childBlob
// parent can only resolve sharedBlob
```

See [Container Nesting](/guide/container-nesting) for more details.

## Container Merging

Merge multiple containers:

```typescript
const c1 = createContainer();
c1.register(blob1, Impl1);

const c2 = createContainer();
c2.register(blob2, Impl2);

const merged = createContainer(c1, c2);
// merged can resolve both blob1 and blob2
// Last parent wins for conflicts
```

## Best Practices

### 1. One Container Per Application

Typically, create one root container for your application:

```typescript
// container.ts
export const container = createContainer();
```

### 2. Register Early

Register all your blobs during application startup:

```typescript
// main.ts
import { container } from './container';
import { registerServices } from './services';

registerServices(container);
// Now start your application
```

### 3. Use Child Containers for Scopes

Create child containers for different scopes (e.g., per-request):

```typescript
const appContainer = createContainer();
// Register app-level services

function handleRequest(req) {
  const requestContainer = createContainer(appContainer);
  // Register request-specific services
}
```

### 4. Avoid Service Locator Pattern

Don't pass the container around. Instead, use dependency injection:

```typescript
// ✗ Avoid
class MyService {
  constructor(private container: Container) {}
  
  doSomething() {
    const logger = this.container.resolve(loggerBlob);
    logger.log('...');
  }
}

// ✓ Better
class MyService {
  constructor(private logger: Logger) {}
  
  doSomething() {
    this.logger.log('...');
  }
}
```

## Next Steps

- [Dependency Resolution](/guide/dependency-resolution) - How dependencies are resolved
- [Container Nesting](/guide/container-nesting) - Advanced container hierarchies
- [Lifecycle Management](/guide/lifecycle) - Control instance lifecycles

