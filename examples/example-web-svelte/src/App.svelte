<script lang="ts">
  import { createContainer } from '@speajus/diblob'
  import {
    attachContainerDisposal,
    provideContainerContext,
  } from '@speajus/diblob-svelte'

  import { registerExampleWebBlobs } from './diblob/register.js'
  import UserList from './components/UserList.svelte'
  import VisualizerTab from './components/VisualizerTab.svelte'

  const container = createContainer()

  registerExampleWebBlobs(container, {
    apiBaseUrl:
      import.meta.env.VITE_USER_SERVICE_URL ?? 'http://localhost:50051',
    visualizerEventsUrl:
      import.meta.env.VITE_VISUALIZER_EVENTS_URL ?? 'http://localhost:3001/events',
  })

  provideContainerContext(container)
  attachContainerDisposal(container)

  let activeTab = $state<'users' | 'visualizer'>('users')
</script>

<main class="app">
  <header class="app-header">
    <h1>diblob + Svelte 5 user directory</h1>
    <p>
      The Users tab uses a diblob container and Connect-ES client to talk to
      example-grpc-server. The Visualizer tab embeds the diblob visualizer for
      both client and server containers.
    </p>
  </header>

  <nav class="tabs">
    <button
      class:active={activeTab === 'users'}
      onclick={() => (activeTab = 'users')}
    >
      Users
    </button>
    <button
      class:active={activeTab === 'visualizer'}
      onclick={() => (activeTab = 'visualizer')}
    >
      Visualizer
    </button>
  </nav>

  {#if activeTab === 'users'}
    <UserList />
  {:else}
    <VisualizerTab />
  {/if}
</main>

