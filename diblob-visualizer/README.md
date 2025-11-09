# 🎨 Diblob Visualizer

Interactive dependency injection graph visualization for [diblob](https://github.com/speajus/diblob).

Visualize your dependency injection container as an interactive graph with nodes representing blobs and edges showing dependencies between them.

## ✨ Features

- 📊 **Interactive Graph Visualization** - Pan, zoom, and drag nodes
- 🔄 **Real-time Updates** - Watch the graph update as you modify your container
- 🎯 **Lifecycle Indicators** - Visual distinction between Singleton and Transient services
- 📈 **Statistics Dashboard** - See counts of nodes, edges, and lifecycle types
- 🎨 **Clean UI** - Modern, responsive design with clear visual hierarchy
- 🔌 **Embeddable** - Easy to integrate into any Svelte application

## 📦 Installation

```bash
npm install @speajus/diblob-visualizer @speajus/diblob
```

## 🚀 Quick Start

### Standalone Demo

```bash
npm install
npm run dev
```

Open http://localhost:5173 to see the visualizer in action.

### Embedding in Your Application

```svelte
<script lang="ts">
  import { DiblobVisualizer } from '@speajus/diblob-visualizer';
  import { createContainer, createBlob } from '@speajus/diblob';

  const container = createContainer();
  const logger = createBlob<Logger>();
  container.register(logger, ConsoleLogger);
</script>

<DiblobVisualizer {container} />
```

## 📖 Usage Examples

See `src/App.svelte` for a complete working example with multiple services.

### Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `container` | `Container` | **required** | The diblob container to visualize |
| `autoRefresh` | `boolean` | `false` | Auto-refresh at intervals |
| `refreshInterval` | `number` | `1000` | Refresh interval (ms) |

### Graph Legend

- **🔒 Blue nodes** - Singleton services
- **⚡ Orange nodes** - Transient services  
- **Red nodes** - Unregistered dependencies
- **Arrows** - Dependencies between services

## 🏗️ Architecture

Built with Svelte 5, Svelte Flow, TypeScript, and Vite.

## 🔧 Development

```bash
npm install
npm run dev      # Start dev server
npm run build    # Build library
npm run check    # Type check
```

## 📝 License

MIT
