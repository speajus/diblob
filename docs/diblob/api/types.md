# Types

TypeScript types and interfaces for diblob.

## Blob

The blob type.

```typescript
type Blob<T> = T;
```

A blob is a proxy that acts as type `T`.

## Factory

Factory function or constructor type.

```typescript
type Factory<T> = 
  | (() => T)
  | (() => Promise<T>)
  | (new (...args: any[]) => T);
```

Can be:
- Sync factory function
- Async factory function
- Class constructor

## Container

Container interface.

```typescript
interface Container {
  register<T>(blob: Blob<T>, factory: Factory<T>, ...deps: any[]): void;
  resolve<T>(blobOrConstructor: Blob<T> | (new (...args: any[]) => T)): Promise<T>;
  has<T>(blob: Blob<T>): boolean;
  unregister<T>(blob: Blob<T>): void;
  clear(): void;
}
```

## RegistrationOptions

Options for blob registration.

```typescript
type LifecycleFn<T> = ((instance: T) => void | Promise<void>)

interface RegistrationOptions<T> {
  lifecycle: Lifecycle;
  dispose?: LifecycleFn<T> | keyof T;
  initialize?: LifecycleFn<T> | keyof T;
}
```

- `lifecycle` - Controls instance creation (Singleton or Transient)
- `dispose` - Method name or function that receives the instance to call when instance is invalidated
- `initialize` - Method name or function that receives the instance to call after instance is created

## Lifecycle

Lifecycle enum.

```typescript
enum Lifecycle {
  Singleton = 'singleton',
  Transient = 'transient'
}
```

- `Singleton` - One instance, reused (default)
- `Transient` - New instance each time

## See Also

- [API Reference](/diblob/api/) - Full API reference
- [Lifecycle Guide](/diblob/guide/lifecycle) - Lifecycle management

