# Remote Visualization

The Diblob Visualizer supports remote connections via Server-Sent Events (SSE), allowing you to visualize containers running in different processes or on different machines.

## Overview

Remote visualization is useful when:
- Your container runs in a backend server
- You want to visualize production containers
- You need to debug containers in different processes
- You want to share visualizations with your team

## Quick Start

### Terminal 1: Start the Server

```bash
cd packages/diblob-visualizer
npm install
npm run server
```

The server will start on `http://localhost:3001` with these endpoints:
- SSE: `http://localhost:3001/events`
- REST API: `http://localhost:3001/graph`
- Health: `http://localhost:3001/health`

### Terminal 2: Start the Visualizer

```bash
cd packages/diblob-visualizer
npm run dev
```

Open `http://localhost:5173` in your browser.

### Using the Visualizer

1. Click "🌐 Remote Mode" button
2. The visualizer connects to the server via SSE
3. Graph updates automatically as the server changes

## Connection Mode

### Server-Sent Events (SSE) - Recommended

- **URL**: `http://localhost:3001/events`
- **Pros**: Simple, reliable, automatic reconnection
- **Best for**: Most use cases

SSE provides a one-way connection from server to client, perfect for pushing graph updates.

## Integration Example

### 1. Create a Server

```typescript
import { createContainer, createBlob } from '@speajus/diblob';
import { createVisualizerServer } from '@speajus/diblob-visualizer/dist/server';

// Your container
const container = createContainer();
const logger = createBlob<Logger>();
container.register(logger, ConsoleLogger);

// Start server
const server = createVisualizerServer(container, {
  port: 3001,
  updateInterval: 1000
});

await server.start();
```

### 2. Use the Remote Visualizer Component

```svelte
<script>
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
          description: 'Logs messages to the console'
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

## Troubleshooting

### Connection Failed

- Check that the server is running
- Verify the URL is correct
- Check CORS settings if connecting from different origin

### Graph Not Updating

- Verify `updateInterval` is set on the server
- Check browser console for errors
- Ensure the container is being modified

### Performance Issues

- Reduce `updateInterval` for large graphs
- Consider filtering which blobs to visualize
- Use production build for better performance

