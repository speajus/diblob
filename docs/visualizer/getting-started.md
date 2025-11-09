# Getting Started with Diblob Visualizer

This guide will help you get started with the Diblob Visualizer.

## Installation

Install both the visualizer and the core diblob package:

```bash
npm install @speajus/diblob-visualizer @speajus/diblob
```

For Svelte applications, you'll also need:

```bash
npm install @xyflow/svelte
```

## Basic Usage

### 1. Create a Container

First, set up your diblob container with some services:

```typescript
import { createBlob, createContainer } from '@speajus/diblob';

// Define interfaces
interface Logger {
  log(message: string): void;
}

interface UserService {
  getUser(id: number): User;
}

// Create blobs with metadata
const logger = createBlob<Logger>('logger', {
  name: 'Console Logger',
  description: 'Logs messages to the console'
});

const userService = createBlob<UserService>('userService', {
  name: 'User Service',
  description: 'Manages user data'
});

// Create container and register services
const container = createContainer({
  name: 'Application Container',
  description: 'Main DI container'
});

container.register(logger, ConsoleLogger);
container.register(userService, UserServiceImpl, logger);
```

### 2. Add the Visualizer

In your Svelte component:

```svelte
<script lang="ts">
  import { DiblobVisualizer } from '@speajus/diblob-visualizer';
  import { container } from './container'; // Your container from step 1
</script>

<div class="app">
  <h1>My Application</h1>
  
  <DiblobVisualizer {container} />
</div>

<style>
  .app {
    padding: 20px;
  }
</style>
```

### 3. View the Graph

Run your application and you'll see an interactive graph showing:
- Nodes for each registered blob
- Edges showing dependencies between blobs
- Lifecycle indicators (Singleton/Transient)
- Statistics about your container

## Using Metadata

Metadata makes the visualizer much more informative. Instead of seeing generic blob IDs, you'll see meaningful names and descriptions.

### Without Metadata

```typescript
const logger = createBlob<Logger>();
// Visualizer shows: "Symbol(blob)"
```

### With Metadata

```typescript
const logger = createBlob<Logger>('logger', {
  name: 'Console Logger',
  description: 'Logs messages to the console',
  version: '1.0.0'
});
// Visualizer shows: "Console Logger" with description
```

## Auto-Refresh

Enable auto-refresh to see changes in real-time:

```svelte
<DiblobVisualizer 
  {container} 
  autoRefresh={true} 
  refreshInterval={2000} 
/>
```

This refreshes the graph every 2 seconds, useful during development.

## Development Mode Only

You might want to show the visualizer only in development:

```svelte
<script lang="ts">
  import { DiblobVisualizer } from '@speajus/diblob-visualizer';
  
  const isDev = import.meta.env.DEV;
</script>

{#if isDev}
  <DiblobVisualizer {container} />
{/if}
```

## Next Steps

- [Embedding Guide](./embedding.md) - Advanced embedding techniques
- [Remote Visualization](./remote.md) - Visualize containers in different processes
- [Examples](./examples.md) - More complex examples
- [API Reference](./api.md) - Complete API documentation

## Troubleshooting

### Graph not showing

Make sure you have:
1. Installed all dependencies
2. Registered at least one blob in the container
3. Passed the container prop to the component

### Styles not working

The visualizer uses scoped styles. If you have global styles interfering, wrap it in a container:

```svelte
<div class="visualizer-wrapper">
  <DiblobVisualizer {container} />
</div>
```

### TypeScript errors

Make sure you have the correct types:

```bash
npm install -D @types/node
```

