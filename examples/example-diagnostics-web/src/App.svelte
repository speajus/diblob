<script lang="ts">
  import DiagnosticsView from './components/DiagnosticsView.svelte';
</script>

<main class="app">
  <header class="app-header">
    <h1>diblob diagnostics dashboard</h1>
    <p class="subtitle">
      This UI calls the <code>DiagnosticsService</code> on the
      <code>example-grpc-server</code> via Connect-ES and renders a
      blob-centric snapshot of recent activity.
    </p>
  </header>

  <DiagnosticsView />
</main>
