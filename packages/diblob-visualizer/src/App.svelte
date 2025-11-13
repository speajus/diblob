<script lang="ts">
  
  import {
    addMetricsService,
    createSampleContainer,
    getLoggerBlob,
    getLoggerImpl
  } from './examples/sample-container.js';

  const _mode = $state<'local' | 'remote'>('local');
  const _remoteUrl = $state('http://localhost:3001/events');

  // Create sample container for local mode demo
  const container = createSampleContainer();
  const _logger = getLoggerBlob();
  const _ConsoleLogger = getLoggerImpl();

  // Function to add more services dynamically
  function _addMoreServices() {
    addMetricsService(container);
  }
</script>

<main>
  <div class="header">
    <h1>🎨 Diblob Visualizer Demo</h1>
    <p>Interactive dependency injection graph visualization</p>
  </div>

  <div class="mode-selector">
    <button
      class:active={mode === 'local'}
      onclick={() => mode = 'local'}
    >
      📦 Local Mode
    </button>
    <button
      class:active={mode === 'remote'}
      onclick={() => mode = 'remote'}
    >
      🌐 Remote Mode
    </button>
  </div>

  {#if mode === 'remote'}
    <div class="remote-config">
      <div class="config-row">
        <label>
          Server URL:
          <input
            type="text"
            bind:value={remoteUrl}
            placeholder="http://localhost:3001/events"
          />
        </label>
      </div>
      <div class="info-box">
        ℹ️ Make sure to run the example server: <code>npm run server</code>
      </div>
    </div>
  {:else}
    <div class="actions">
      <button onclick={addMoreServices}>
        ➕ Add Metrics Service
      </button>
      <button onclick={() => container.register(logger, ConsoleLogger)}>
        🔄 Re-register Logger
      </button>
    </div>
  {/if}

  {#if mode === 'local'}
    <DiblobVisualizer {container} />
  {:else}
    <RemoteDiblobVisualizer url={remoteUrl} />
  {/if}

  <div class="info">
    <h3>About this demo</h3>
    {#if mode === 'local'}
      <p>
        This demo shows a sample dependency injection setup with multiple services.
        The graph visualizes the relationships between services:
      </p>
      <ul>
        <li><strong>🔒 Blue nodes</strong> are Singleton services (created once)</li>
        <li><strong>⚡ Orange nodes</strong> are Transient services (created each time)</li>
        <li><strong>Arrows</strong> show dependencies between services</li>
      </ul>
      <p>
        Try clicking the buttons above to modify the container and see the graph update!
      </p>
    {:else}
      <p>
        This demo shows how to connect to a remote diblob container server.
        The visualizer receives real-time updates via Server-Sent Events (SSE).
      </p>
      <p>
        To run the server:
      </p>
      <ol>
        <li>Open a new terminal</li>
        <li>Run: <code>npm run server</code></li>
        <li>The server will start on port 3001</li>
        <li>The visualizer will automatically connect and display the container graph</li>
      </ol>
    {/if}
  </div>
</main>

<style>
  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .header h1 {
    font-size: 2.5rem;
    margin: 0;
    color: #333;
  }

  .header p {
    color: #666;
    font-size: 1.1rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .actions button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .actions button:hover {
    background: #45a049;
  }

  .mode-selector {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .mode-selector button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: #f5f5f5;
    color: #333;
    border: 2px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mode-selector button.active {
    background: #2196f3;
    color: white;
    border-color: #2196f3;
  }

  .mode-selector button:hover:not(.active) {
    background: #e0e0e0;
  }

  .remote-config {
    max-width: 600px;
    margin: 0 auto 2rem;
    padding: 1.5rem;
    background: #f9f9f9;
    border-radius: 8px;
    border: 1px solid #ddd;
  }

  .config-row {
    margin-bottom: 1rem;
  }

  .config-row label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #333;
  }

  .config-row input {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .info-box {
    padding: 1rem;
    background: #e3f2fd;
    border-left: 4px solid #2196f3;
    border-radius: 4px;
    font-size: 0.9rem;
    margin-top: 1rem;
  }

  .info-box code {
    background: #fff;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: monospace;
  }

  .info {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #f5f5f5;
    border-radius: 8px;
  }

  .info h3 {
    margin-top: 0;
    color: #333;
  }

  .info ul,
  .info ol {
    line-height: 1.8;
  }

  .info code {
    background: #fff;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: monospace;
    color: #d32f2f;
  }
</style>
