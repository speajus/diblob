# Diblob Visualizer - Usage Modes

The diblob-visualizer package now supports three distinct usage modes to fit different use cases.

## 1. CLI Mode

Start a standalone server that serves the visualizer interface.

### Installation

```bash
# Global installation
npm install -g @speajus/diblob-visualizer

# Or use with npx (no installation needed)
npx @speajus/diblob-visualizer
```

### Usage

```bash
# Start with default settings (port 3000, localhost)
diblob-visualizer

# Custom port
diblob-visualizer --port 8080

# Bind to all interfaces
diblob-visualizer --host 0.0.0.0 --port 3000

# Disable CORS
diblob-visualizer --no-cors

# Show help
diblob-visualizer --help
```

### Use Cases
- Quick visualization without setting up a server
- Development and debugging
- Sharing visualizations with team members

---

## 2. Express Middleware Mode

Embed the visualizer into existing Express/Node.js servers.

### Installation

```bash
npm install @speajus/diblob-visualizer express
```

### Usage

```typescript
import express from 'express';
import { createContainer, createBlob } from '@speajus/diblob';
import { createVisualizerMiddleware } from '@speajus/diblob-visualizer/middleware';

const app = express();
const container = createContainer();

// Add the visualizer middleware
app.use(createVisualizerMiddleware({
  container,
  path: '/visualizer',      // Base path for visualizer routes
  updateInterval: 1000,     // Update interval in ms
  cors: true                // Enable CORS
}));

app.listen(3000);
```

### Endpoints

When mounted at `/visualizer`, the middleware provides:
- `GET /visualizer/events` - SSE endpoint for real-time updates
- `GET /visualizer/graph` - REST API for one-time graph fetch
- `GET /visualizer/health` - Health check endpoint

### Use Cases
- Integrating visualization into existing applications
- Production monitoring dashboards
- Custom authentication/authorization flows

---

## 3. Web Component Mode

Framework-agnostic web component that can be embedded in any web application.

### Installation

```bash
npm install @speajus/diblob-visualizer
```

### Usage

#### In HTML

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="node_modules/@speajus/diblob-visualizer/dist/web-component/web-component.js"></script>
</head>
<body>
  <diblob-visualizer 
    url="http://localhost:3001/events"
    mode="remote"
    updateInterval="1000">
  </diblob-visualizer>
</body>
</html>
```

#### In React

```jsx
import '@speajus/diblob-visualizer/web-component';

function App() {
  return (
    <diblob-visualizer 
      url="http://localhost:3001/events"
      mode="remote"
      updateInterval={1000}
    />
  );
}
```

#### In Vue

```vue
<template>
  <diblob-visualizer 
    url="http://localhost:3001/events"
    mode="remote"
    :updateInterval="1000"
  />
</template>

<script>
import '@speajus/diblob-visualizer/web-component';
</script>
```

#### In Svelte

```svelte
<script>
  import '@speajus/diblob-visualizer/web-component';
</script>

<diblob-visualizer 
  url="http://localhost:3001/events"
  mode="remote"
  updateInterval={1000}
/>
```

### Attributes

- `url` (string) - The SSE endpoint URL
- `mode` (string) - "local" or "remote" (default: "remote")
- `updateInterval` (number) - Update interval in milliseconds (default: 1000)

### Use Cases
- Embedding in React, Vue, Angular, or other framework applications
- Micro-frontend architectures
- Reusable visualization components

---

## Package Exports

The package provides the following exports:

```typescript
// Svelte components (default export)
import { DiblobVisualizer, RemoteDiblobVisualizer } from '@speajus/diblob-visualizer';

// Server utilities
import { createVisualizerServer } from '@speajus/diblob-visualizer/server';

// Express middleware
import { createVisualizerMiddleware } from '@speajus/diblob-visualizer/middleware';

// Web component (auto-registers when imported)
import '@speajus/diblob-visualizer/web-component';
```

---

## Examples

See the `examples/` directory for complete working examples:
- `examples/express-middleware.ts` - Express middleware integration
- `examples/web-component.html` - Web component usage
- `examples/cli-usage.sh` - CLI examples

