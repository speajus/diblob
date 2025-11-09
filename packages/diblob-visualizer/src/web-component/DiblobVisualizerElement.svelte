<svelte:options customElement="diblob-visualizer" />

<script lang="ts">
  import DependencyGraph from '../lib/DependencyGraph.svelte';
  import { getGraphStats, type DependencyGraph as GraphData } from '../lib/container-introspection';
  import { onMount } from 'svelte';

  // Props that can be set via attributes
  let {
    url = '',
    mode = 'remote',
    updateInterval = 1000
  }: {
    url?: string;
    mode?: 'local' | 'remote';
    updateInterval?: number;
  } = $props();

  let graph = $state<GraphData>({ nodes: [], edges: [] });
  let stats = $state({
    totalNodes: 0,
    totalEdges: 0,
    singletons: 0,
    transients: 0,
    unregistered: 0,
    maxDepth: 0,
  });
  let connectionStatus = $state<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  let errorMessage = $state<string>('');

  let eventSource: EventSource | null = null;

  function updateFromData(data: any) {
    if (data.graph) {
      graph = data.graph;
      stats = data.stats || getGraphStats(data.graph);
    }
  }

  function connect() {
    if (!url) {
      connectionStatus = 'error';
      errorMessage = 'No URL provided';
      return;
    }

    disconnect();
    connectionStatus = 'connecting';
    errorMessage = '';

    try {
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        connectionStatus = 'connected';
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          updateFromData(data);
        } catch (err) {
          console.error('Failed to parse SSE data:', err);
        }
      };

      eventSource.onerror = (err) => {
        connectionStatus = 'error';
        errorMessage = 'SSE connection error';
        console.error('SSE error:', err);
      };
    } catch (err) {
      connectionStatus = 'error';
      errorMessage = err instanceof Error ? err.message : 'Failed to connect';
    }
  }

  function disconnect() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    connectionStatus = 'disconnected';
  }

  onMount(() => {
    if (mode === 'remote' && url) {
      connect();
    }
    return () => disconnect();
  });

  function handleReconnect() {
    connect();
  }
</script>

<div class="visualizer">
  <div class="header">
    <h2>Diblob Dependency Graph</h2>
    <div class="controls">
      <div class="status-indicator status-{connectionStatus}">
        {#if connectionStatus === 'connecting'}
          🔄 Connecting...
        {:else if connectionStatus === 'connected'}
          ✅ Connected
        {:else if connectionStatus === 'error'}
          ❌ Error
        {:else}
          ⚪ Disconnected
        {/if}
      </div>
      <button onclick={handleReconnect} class="refresh-btn">
        🔄 Reconnect
      </button>
    </div>
  </div>

  {#if errorMessage}
    <div class="error-message">
      ⚠️ {errorMessage}
    </div>
  {/if}

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
  </div>

  <DependencyGraph {graph} />
</div>

