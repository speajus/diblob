<script lang="ts">
  import DependencyGraph from './DependencyGraph.svelte';
  import { getGraphStats, type DependencyGraph as GraphData } from './container-introspection';
  import { onMount } from 'svelte';

  let {
    url
  }: {
    url: string;
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
    connect();
    return () => disconnect();
  });

  function handleReconnect() {
    connect();
  }
</script>

<div class="visualizer">
  <div class="header">
    <h2>Diblob Dependency Graph (Remote)</h2>
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
    align-items: center;
  }

  .status-indicator {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
  }

  .status-connecting {
    background: #fff3e0;
    color: #f57c00;
  }

  .status-connected {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .status-error {
    background: #ffebee;
    color: #c62828;
  }

  .status-disconnected {
    background: #f5f5f5;
    color: #757575;
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

  .error-message {
    padding: 12px;
    margin-bottom: 15px;
    background: #ffebee;
    border: 1px solid #f44336;
    border-radius: 6px;
    color: #c62828;
    font-size: 14px;
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

