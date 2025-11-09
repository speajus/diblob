# Diblob Visualizer Server

The Diblob Visualizer server exposes your container data for remote visualization via Server-Sent Events (SSE) or HTTP polling.

## Quick Start

### 1. Run the Example Server

```bash
cd packages/diblob-visualizer
npm install
npm run server
```

This starts a server on `http://localhost:3001` that exposes the container data.

### 2. Run the Visualizer

In another terminal:

```bash
npm run dev
```

Open `http://localhost:5173` and switch to "Remote Mode" to connect to the server.

## Server API

The server exposes the following endpoints:

### Server-Sent Events: `http://localhost:3001/events`

Server-to-client streaming connection. The server pushes updates to the client.

```javascript
const eventSource = new EventSource('http://localhost:3001/events');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Graph update:', data);
};
```

### HTTP Polling: `http://localhost:3001/graph`

One-time fetch of the current graph state.

```javascript
const response = await fetch('http://localhost:3001/graph');
const data = await response.json();
console.log('Graph data:', data);
```

### Health Check: `http://localhost:3001/health`

Check server status and connected clients.

```javascript
const response = await fetch('http://localhost:3001/health');
const data = await response.json();
// { status: 'ok', clients: 2 }
```

## Using in Your Application

### 1. Create a Server

```typescript
import { createContainer, createBlob } from '@speajus/diblob';
import { createVisualizerServer } from '@speajus/diblob-visualizer/dist/server';

// Set up your container
const container = createContainer();
const logger = createBlob<Logger>();
container.register(logger, ConsoleLogger);

// Create and start the server
const server = createVisualizerServer(container, {
  port: 3001,
  host: 'localhost',
  cors: true,
  updateInterval: 1000 // Send updates every second
});

await server.start();
```

### 2. Use the Remote Visualizer Component

```svelte
<script lang="ts">
  import { RemoteDiblobVisualizer } from '@speajus/diblob-visualizer';
</script>

<RemoteDiblobVisualizer 
  url="http://localhost:3001/events" 
  mode="sse" 
/>
```

## Server Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | `number` | `3001` | Server port |
| `host` | `string` | `'localhost'` | Server host |
| `cors` | `boolean` | `true` | Enable CORS |
| `updateInterval` | `number` | `1000` | Update interval in milliseconds |

## Connection Modes

### SSE (Server-Sent Events)
- **Pros**: Simple, automatic reconnection, works through proxies
- **Cons**: One-way communication only
- **Best for**: Most use cases, production deployments

### HTTP Polling
- **Pros**: Works everywhere, simple
- **Cons**: Higher latency, more server load
- **Best for**: Restrictive network environments

## Data Format

The server sends graph updates in this format:

```typescript
{
  type: 'graph',
  timestamp: 1234567890,
  graph: {
    nodes: [
      {
        id: 'Symbol(logger)',
        blobId: Symbol(logger),
        label: 'ConsoleLogger',
        lifecycle: 'singleton',
        isRegistered: true,
        factoryName: 'ConsoleLogger',
        metadata: {
          name: 'Console Logger',
          description: 'Logs to console'
        }
      }
    ],
    edges: [
      {
        id: 'Symbol(userService)->Symbol(logger)',
        source: 'Symbol(userService)',
        target: 'Symbol(logger)',
        label: 'dep0'
      }
    ]
  },
  stats: {
    totalNodes: 6,
    totalEdges: 8,
    singletons: 5,
    transients: 1,
    unregistered: 0,
    maxDepth: 3
  }
}
```

## Production Deployment

For production use:

1. **Secure the server**: Add authentication/authorization
2. **Use HTTPS**: Enable TLS for encrypted connections
3. **Rate limiting**: Prevent abuse
4. **Monitoring**: Track connected clients and performance

Example with authentication:

```typescript
const server = createVisualizerServer(container, {
  port: 3001,
  cors: false // Disable CORS in production
});

// Add custom middleware for authentication
// (Implementation depends on your auth system)
```

## Example Server

See `packages/diblob-visualizer/example-server.ts` for a complete working example.

