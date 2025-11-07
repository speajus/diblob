# createContainer

Creates a new DI container for managing blob registrations.

## Signature

```typescript
function createContainer(...parents: Container[]): Container
```

## Parameters

- `...parents` (optional) - Parent containers for nesting or merging

## Returns

`Container` - A new container instance

## Examples

### Basic Container

```typescript
import { createContainer } from 'diblob';

const container = createContainer();
```

### Nested Container

```typescript
const parent = createContainer();
parent.register(logger, ConsoleLogger);

const child = createContainer(parent);
child.register(database, DatabaseImpl);

// child can resolve both logger and database
```

### Merged Containers

```typescript
const c1 = createContainer();
c1.register(logger, ConsoleLogger);

const c2 = createContainer();
c2.register(database, DatabaseImpl);

const merged = createContainer(c1, c2);
// merged can resolve both logger and database
```

## See Also

- [Containers Guide](/guide/containers) - Comprehensive guide
- [Container Nesting](/guide/container-nesting) - Nesting and merging
- [Container Methods](/api/container-methods) - Container operations

