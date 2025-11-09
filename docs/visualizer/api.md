# API Reference

Complete API documentation for the Diblob Visualizer components.

## DiblobVisualizer

The main visualizer component for local containers.

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `container` | `Container` | - | ✅ | The diblob container to visualize |
| `autoRefresh` | `boolean` | `false` | ❌ | Enable automatic graph refresh |
| `refreshInterval` | `number` | `1000` | ❌ | Refresh interval in milliseconds (when autoRefresh is true) |

### Usage

```svelte
<script lang="ts">
  import { DiblobVisualizer } from '@speajus/diblob-visualizer';
  import { createContainer } from '@speajus/diblob';

  const container = createContainer();
</script>

<DiblobVisualizer 
  {container} 
  autoRefresh={true} 
  refreshInterval={2000} 
/>
```

## RemoteDiblobVisualizer

Visualizer component for remote containers.

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `url` | `string` | - | ✅ | Server URL (e.g., 'http://localhost:3001/events') |
| `mode` | `'sse' \| 'polling'` | `'sse'` | ❌ | Connection mode |
| `pollingInterval` | `number` | `2000` | ❌ | Polling interval in milliseconds (when mode is 'polling') |

### Usage

```svelte
<script lang="ts">
  import { RemoteDiblobVisualizer } from '@speajus/diblob-visualizer';
</script>

<RemoteDiblobVisualizer 
  url="http://localhost:3001/events" 
  mode="sse" 
/>
```

## createVisualizerServer

Creates a visualization server for remote access.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `container` | `Container` | ✅ | The container to expose |
| `options` | `ServerOptions` | ❌ | Server configuration options |

### ServerOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | `number` | `3001` | Server port |
| `host` | `string` | `'localhost'` | Server host |
| `cors` | `boolean` | `true` | Enable CORS |
| `updateInterval` | `number` | `1000` | Update interval in milliseconds |

### Returns

Returns a server object with the following methods:

| Method | Returns | Description |
|--------|---------|-------------|
| `start()` | `Promise<void>` | Start the server |
| `stop()` | `Promise<void>` | Stop the server |

### Usage

```typescript
import { createVisualizerServer } from '@speajus/diblob-visualizer/dist/server';
import { createContainer } from '@speajus/diblob';

const container = createContainer();

const server = createVisualizerServer(container, {
  port: 3001,
  host: 'localhost',
  cors: true,
  updateInterval: 1000
});

await server.start();

// Later...
await server.stop();
```

## Types

### BlobNode

Represents a node in the dependency graph.

```typescript
interface BlobNode {
  id: string;
  blobId: symbol;
  label: string;
  lifecycle: 'singleton' | 'transient';
  isRegistered: boolean;
  factoryName?: string;
  metadata?: BlobMetadata;
  dependencies: symbol[];
}
```

### BlobMetadata

Metadata attached to blobs.

```typescript
interface BlobMetadata {
  name?: string;
  description?: string;
  [key: string]: any;
}
```

### GraphData

The complete graph data structure.

```typescript
interface GraphData {
  nodes: BlobNode[];
  edges: {
    id: string;
    source: string;
    target: string;
    label: string;
  }[];
}
```

### GraphStats

Statistics about the dependency graph.

```typescript
interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  singletons: number;
  transients: number;
  unregistered: number;
  maxDepth: number;
}
```

## Events

### DiblobVisualizer Events

The component doesn't emit custom events, but you can listen to standard Svelte component lifecycle events.

### RemoteDiblobVisualizer Events

The component doesn't emit custom events, but connection status is displayed in the UI.

## CSS Classes

You can style the visualizer using these CSS classes:

- `.visualizer` - Main container
- `.graph-container` - Graph viewport
- `.stats-panel` - Statistics panel
- `.node` - Graph nodes
- `.edge` - Graph edges
- `.singleton-node` - Singleton nodes
- `.transient-node` - Transient nodes
- `.unregistered-node` - Unregistered nodes

### Example

```svelte
<style>
  :global(.visualizer) {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  :global(.graph-container) {
    height: 800px;
  }
</style>
```

