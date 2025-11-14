<script lang="ts">
  import { useBlob, useContainer } from '@speajus/diblob-svelte'
  import {
    DiblobVisualizer,
    RemoteDiblobVisualizer,
  } from '@speajus/diblob-visualizer'

  import { exampleWebConfig, type ExampleWebConfig } from '../diblob/blobs.js'

  const container = useContainer()
  const configRef = useBlob(exampleWebConfig) as
    | ExampleWebConfig
    | Promise<ExampleWebConfig>

  let activeView = $state<'client' | 'server'>('client')
  let serverEventsUrl = $state('http://localhost:3001/events')

  $effect(async () => {
    const config = await configRef
    serverEventsUrl = config.visualizerEventsUrl
  })
</script>

<section class="visualizer">
  <header>
    <h2>Visualizer</h2>
    <p>
      Inspect the client-side diblob container or connect to the remote
      visualizer exposed by the example-gRPC server.
    </p>
  </header>

  <div class="mode-selector">
    <button
      class:active={activeView === 'client'}
      onclick={() => (activeView = 'client')}
    >
      Client container
    </button>
    <button
      class:active={activeView === 'server'}
      onclick={() => (activeView = 'server')}
    >
      Server container
    </button>
  </div>

  {#if activeView === 'client'}
    <DiblobVisualizer {container} />
  {:else}
    <RemoteDiblobVisualizer url={serverEventsUrl} />
    <p class="hint">
      The remote view connects to the diblob-visualizer SSE endpoint.
      Make sure the example-gRPC server is running with the visualizer
      enabled.
    </p>
  {/if}
</section>

<style>
  .visualizer header {
    margin-bottom: 1rem;
  }

  .mode-selector {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .mode-selector button {
    border-radius: 999px;
    border: 1px solid #d1d5db;
    padding: 0.35rem 0.9rem;
    background: #f9fafb;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .mode-selector button.active {
    background: #111827;
    color: #f9fafb;
    border-color: #111827;
  }

  .hint {
    margin-top: 0.75rem;
    font-size: 0.85rem;
    color: #6b7280;
  }
</style>

