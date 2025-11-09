# Embedding Diblob Visualizer

This guide shows how to embed the Diblob Visualizer in your own applications.

## Installation

```bash
npm install @speajus/diblob-visualizer @speajus/diblob @xyflow/svelte
```

## Basic Embedding

### In a Svelte Application

```svelte
<script lang="ts">
  import { DiblobVisualizer } from '@speajus/diblob-visualizer';
  import { createContainer, createBlob } from '@speajus/diblob';

  // Your existing container
  const container = createContainer();
  
  // Your blob registrations
  const logger = createBlob<Logger>();
  container.register(logger, ConsoleLogger);
  
  // ... more registrations
</script>

<div class="my-app">
  <h1>My Application</h1>
  
  <!-- Embed the visualizer -->
  <DiblobVisualizer {container} />
</div>

<style>
  .my-app {
    padding: 20px;
  }
</style>
```

### With Auto-Refresh

```svelte
<DiblobVisualizer 
  {container} 
  autoRefresh={true} 
  refreshInterval={2000} 
/>
```

This will automatically refresh the graph every 2 seconds, useful during development.

## Advanced Usage

### Custom Styling

The visualizer uses scoped styles, but you can override them:

```svelte
<div class="custom-visualizer">
  <DiblobVisualizer {container} />
</div>

<style>
  .custom-visualizer :global(.visualizer) {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .custom-visualizer :global(.graph-container) {
    height: 800px;
  }
</style>
```

### Conditional Rendering

Only show the visualizer in development:

```svelte
<script lang="ts">
  import { DiblobVisualizer } from '@speajus/diblob-visualizer';
  
  const isDev = import.meta.env.DEV;
</script>

{#if isDev}
  <DiblobVisualizer {container} />
{/if}
```

### In a Modal/Drawer

```svelte
<script lang="ts">
  let showVisualizer = false;
</script>

<button on:click={() => showVisualizer = !showVisualizer}>
  Toggle Visualizer
</button>

{#if showVisualizer}
  <div class="modal">
    <div class="modal-content">
      <button on:click={() => showVisualizer = false}>Close</button>
      <DiblobVisualizer {container} />
    </div>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 12px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
  }
</style>
```

## Using with Different Frameworks

### React (via Svelte wrapper)

You'll need to create a wrapper component:

```tsx
// DiblobVisualizerWrapper.tsx
import { useEffect, useRef } from 'react';
import type { Container } from '@speajus/diblob';

export function DiblobVisualizerWrapper({ container }: { container: Container }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import and mount Svelte component
    import('@speajus/diblob-visualizer').then(({ DiblobVisualizer }) => {
      new DiblobVisualizer({
        target: containerRef.current!,
        props: { container }
      });
    });
  }, [container]);

  return <div ref={containerRef} />;
}
```

### Vue (via Svelte wrapper)

Similar approach for Vue:

```vue
<template>
  <div ref="visualizerContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Container } from '@speajus/diblob';

const props = defineProps<{ container: Container }>();
const visualizerContainer = ref<HTMLDivElement>();

onMounted(async () => {
  const { DiblobVisualizer } = await import('@speajus/diblob-visualizer');
  
  new DiblobVisualizer({
    target: visualizerContainer.value!,
    props: { container: props.container }
  });
});
</script>
```

## Tips

1. **Performance**: For large dependency graphs (>50 nodes), consider using `autoRefresh={false}` and manually triggering refreshes
2. **Styling**: The visualizer is designed to be embeddable with minimal CSS conflicts
3. **Development**: Use the visualizer during development to understand your DI setup
4. **Documentation**: Generate screenshots of the graph for documentation

## Troubleshooting

### Graph not updating

Make sure you're calling the refresh button or using `autoRefresh={true}`.

### Styles conflicting

The visualizer uses scoped styles, but if you have global styles affecting it, wrap it in a container with specific styles.

### TypeScript errors

Make sure you have the correct types installed:

```bash
npm install -D @types/node
```

