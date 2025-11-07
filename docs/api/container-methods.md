# Container Methods

Methods available on Container instances.

## register

Register a blob with its implementation.

### Signature

```typescript
register<T>(
  blob: Blob<T>,
  factory: Factory<T>,
  ...deps: any[]
): void
```

### Parameters

- `blob` - The blob to register
- `factory` - Constructor or factory function
- `...deps` - Dependencies (blobs or plain values)
  - Last argument can be `{ lifecycle: Lifecycle }` for options

### Examples

```typescript
// With constructor
container.register(logger, ConsoleLogger);

// With dependencies
container.register(userService, UserServiceImpl, logger, database);

// With factory
container.register(config, () => new ConfigImpl());

// With lifecycle
container.register(logger, ConsoleLogger, { lifecycle: Lifecycle.Transient });
```

## resolve

Resolve a blob or class to its instance.

### Signature

```typescript
resolve<T>(blobOrConstructor: Blob<T> | (new (...args: any[]) => T)): Promise<T>
```

### Parameters

- `blobOrConstructor` - Blob or class constructor to resolve

### Returns

`Promise<T>` - The resolved instance

### Examples

```typescript
// Resolve blob
const logger = await container.resolve(loggerBlob);

// Resolve class with blob dependencies
class MyService {
  constructor(private logger = loggerBlob) {}
}
const service = await container.resolve(MyService);
```

## has

Check if a blob is registered.

### Signature

```typescript
has<T>(blob: Blob<T>): boolean
```

### Parameters

- `blob` - The blob to check

### Returns

`boolean` - True if registered, false otherwise

### Example

```typescript
if (container.has(logger)) {
  console.log('Logger is registered');
}
```

## unregister

Unregister a blob.

### Signature

```typescript
unregister<T>(blob: Blob<T>): void
```

### Parameters

- `blob` - The blob to unregister

### Example

```typescript
container.unregister(logger);
```

## clear

Clear all registrations.

### Signature

```typescript
clear(): void
```

### Example

```typescript
container.clear();
```

## See Also

- [Containers Guide](/guide/containers) - Comprehensive guide
- [API Reference](/api/) - Full API reference

