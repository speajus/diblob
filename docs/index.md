---
layout: home

hero:
  name: diblob
  text: Dependency Injection Reimagined
  tagline: A DI framework where the proxy (blob) is the key
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/jspears/diblob

features:
  - icon: 🎯
    title: Blob as Key
    details: The proxy itself is both the identifier and the interface. No separate tokens or keys needed.
  
  - icon: ⚡
    title: Automatic Resolution
    details: Dependencies are automatically inspected and resolved. Just pass blobs as parameters.
  
  - icon: 🔄
    title: Reactive Dependencies
    details: When a blob is re-registered, all dependents automatically update with the new implementation.
  
  - icon: 🚀
    title: Async Support
    details: Full support for async factories and async resolution. Async dependencies are handled automatically.
  
  - icon: 🏗️
    title: Container Nesting
    details: Create child containers or merge multiple containers for flexible architecture.
  
  - icon: 💉
    title: Constructor Injection
    details: Blobs work as default parameters and property initializers for seamless injection.
  
  - icon: 📘
    title: Type-Safe
    details: Full TypeScript support with type inference. The blob IS the type.
  
  - icon: 🎨
    title: Lifecycle Control
    details: Choose between Singleton and Transient lifecycles for your dependencies.
---

## Quick Example

```typescript
import { createBlob, createContainer } from 'diblob';

// Define your interfaces
interface Logger {
  log(message: string): void;
}

interface UserService {
  getUser(id: number): User;
}

// Create blobs
const logger = createBlob<Logger>();
const userService = createBlob<UserService>();

// Create container and register
const container = createContainer();
container.register(logger, ConsoleLogger);
container.register(userService, UserServiceImpl, logger);

// Use the blob directly - it acts as the interface!
userService.getUser(123);
```

## Why diblob?

Traditional DI frameworks require you to:
1. Create a separate token/key
2. Register the implementation with that key
3. Retrieve the instance using `container.resolve(key)`

With **diblob**, the blob IS the key. You pass it around, and it acts like the interface you assigned to it. No extra steps, no ceremony.

## Installation

::: code-group
```bash [npm]
npm install diblob
```

```bash [yarn]
yarn add diblob
```

```bash [pnpm]
pnpm add diblob
```
:::

## Requirements

- Node.js >= 22.0.0
- TypeScript >= 5.3.3 (for TypeScript projects)

