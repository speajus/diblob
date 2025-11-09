# What is diblob?

**diblob** is a dependency injection (DI) framework for TypeScript/JavaScript that takes a unique approach: **the proxy (blob) is the key**.

## The Problem with Traditional DI

Traditional DI frameworks typically work like this:

```typescript
// Create a token/key
const LOGGER_TOKEN = Symbol('Logger');

// Register with the token
container.register(LOGGER_TOKEN, ConsoleLogger);

// Retrieve using the token
const logger = container.resolve(LOGGER_TOKEN);
logger.log('Hello');
```

This approach has several issues:
- **Ceremony**: You need to create and manage separate tokens
- **Indirection**: The token is separate from the type
- **Manual retrieval**: You must explicitly call `container.resolve()`
- **No reactivity**: Changes require manual updates

## The diblob Approach

With diblob, the blob itself is both the identifier and the interface:

```typescript
// Create a blob - it's both the key AND the interface
const logger = createBlob<Logger>();

// Register the blob
container.register(logger, ConsoleLogger);

// Use the blob directly - no get() needed!
logger.log('Hello');
```

The blob acts as a proxy that forwards all operations to the registered implementation.

## Key Benefits

### 1. Blob as Key
The proxy itself is the identifier. No separate tokens or keys needed.

### 2. Direct Usage
Use the blob directly without calling `container.resolve()`. It acts like the interface.

### 3. Type Safety
The blob IS the type. TypeScript knows exactly what methods and properties are available.

### 4. Automatic Resolution
Dependencies are automatically inspected and resolved when you register them.

### 5. Reactive Updates
When you re-register a blob, all dependents automatically get the new implementation.

### 6. Constructor Injection
Blobs work as default parameters, enabling seamless constructor injection.

## How It Works

Under the hood, diblob uses JavaScript Proxies to create blobs that:
1. Act as placeholders for the actual implementation
2. Forward all operations to the registered instance
3. Track dependencies automatically
4. Update reactively when implementations change

## When to Use diblob

diblob is ideal for:
- **TypeScript/JavaScript applications** that need dependency injection
- **Projects** where you want minimal ceremony and maximum type safety
- **Applications** that benefit from reactive dependency updates
- **Codebases** where you want to avoid service locator patterns

## Comparison with Other DI Frameworks

| Feature | Traditional DI | diblob |
|---------|---------------|--------|
| Key | Separate token | The blob itself |
| Usage | `container.resolve(key)` | Use blob directly |
| Type safety | Token must match type | Blob IS the type |
| Reactivity | Manual | Automatic |
| Constructor injection | Complex setup | Default parameters |

## Next Steps

Ready to get started? Check out the [Getting Started](/diblob/guide/getting-started) guide.

