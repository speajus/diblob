<script lang="ts">
  import type { Container } from '@speajus/diblob';
  import { onMount } from 'svelte';
  import { extractDependencyGraph, type DependencyGraph as GraphData, getGraphStats } from '../shared/container-introspection';
  // biome-ignore lint/correctness/noUnusedImports: used but biome doesn't get it    
  import DependencyGraph from './DependencyGraph.svelte';

  const {
    container,
    autoRefresh = false,
    refreshInterval = 1000
  }: {
    container: Container;
    autoRefresh?: boolean;
    refreshInterval?: number;
  } = $props();

  // biome-ignore lint/correctness/noUnusedVariables : used but biome doesn't get it    
  let graph = $state<GraphData>({ nodes: [], edges: [] });
  // biome-ignore lint/correctness/noUnusedVariables : used but biome doesn't get it    
  let stats = $state({
    totalNodes: 0,
    totalEdges: 0,
    singletons: 0,
    transients: 0,
    unregistered: 0,
    maxDepth: 0,
  });

  function updateGraph() {
    const newGraph = extractDependencyGraph(container);
    graph = newGraph;
    stats = getGraphStats(newGraph);
  }

  // Initialize on mount
  onMount(updateGraph);

  // Auto-refresh if enabled
  $effect(() => {
    if (autoRefresh) {
      const interval = setInterval(updateGraph, refreshInterval);
      return () => clearInterval(interval);
    }
  });

  // biome-ignore lint/correctness/noUnusedVariables : used but biome doesn't get it    
  function handleRefresh() {
    updateGraph();
  }
</script>

<div class="visualizer">
  <div class="header">
    <h2>Diblob Dependency Graph</h2>
    <div class="controls">
      <button onclick={handleRefresh} class="refresh-btn">
        🔄 Refresh
      </button>
    </div>
  </div>

  <div class="stats">
    <div class="stat-item">
      <span class="stat-label">Nodes:</span>
      <span class="stat-value">{stats.totalNodes}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Edges:</span>
      <span class="stat-value">{stats.totalEdges}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">🔒 Singletons:</span>
      <span class="stat-value">{stats.singletons}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">⚡ Transients:</span>
      <span class="stat-value">{stats.transients}</span>
    </div>
    {#if stats.unregistered > 0}
      <div class="stat-item warning">
        <span class="stat-label">⚠️ Unregistered:</span>
        <span class="stat-value">{stats.unregistered}</span>
      </div>
    {/if}
  </div>

  <div class="legend">
    <div class="legend-item">
      <div class="legend-box singleton"></div>
      <span>Singleton (🔒)</span>
    </div>
    <div class="legend-item">
      <div class="legend-box transient"></div>
      <span>Transient (⚡)</span>
    </div>
    <div class="legend-item">
      <div class="legend-box unregistered"></div>
      <span>Unregistered</span>
    </div>
  </div>

  <DependencyGraph {graph} />
</div>

<style>
  .visualizer {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    padding: 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .header h2 {
    margin: 0;
    font-size: 24px;
    color: #333;
  }

  .controls {
    display: flex;
    gap: 10px;
  }

  .refresh-btn {
    padding: 8px 16px;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
  }

  .refresh-btn:hover {
    background: #1976d2;
  }

  .stats {
    display: flex;
    gap: 20px;
    margin-bottom: 15px;
    flex-wrap: wrap;
  }

  .stat-item {
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    background: #f5f5f5;
    border-radius: 6px;
    font-size: 14px;
  }

  .stat-item.warning {
    background: #fff3e0;
    border: 1px solid #ff9800;
  }

  .stat-label {
    font-weight: 600;
    color: #666;
  }

  .stat-value {
    color: #333;
    font-weight: bold;
  }

  .legend {
    display: flex;
    gap: 20px;
    margin-bottom: 15px;
    font-size: 13px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .legend-box {
    width: 20px;
    height: 20px;
    border-radius: 4px;
  }

  .legend-box.singleton {
    background: #e3f2fd;
    border: 3px solid #2196f3;
  }

  .legend-box.transient {
    background: #fff3e0;
    border: 2px solid #ff9800;
  }

  .legend-box.unregistered {
    background: #ffebee;
    border: 2px solid #f44336;
  }
</style>

