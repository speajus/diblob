<script lang="ts">
  import { createClient, type Client } from '@connectrpc/connect';
  import { createConnectTransport } from '@connectrpc/connect-web';

  import {
    DiagnosticsService,
    type DiagnosticsBlobSummary,
    type GetDiagnosticsSnapshotResponse,
  } from '../grpc/diagnostics_pb.js';

  const baseUrl =
    import.meta.env.VITE_DIAGNOSTICS_SERVICE_URL ?? 'http://localhost:50051';

  const transport = createConnectTransport({ baseUrl });
  const client: Client<typeof DiagnosticsService> = createClient(
    DiagnosticsService,
    transport,
  );

  let windowSeconds = $state(300);
  let maxBlobs = $state(16);
  let severityThreshold = $state<'debug' | 'info' | 'warn' | 'error'>('info');

  let loading = $state(false);
  let errorMessage = $state<string | null>(null);
  let snapshot = $state<GetDiagnosticsSnapshotResponse | null>(null);

  const hasBlobs = $derived(
    snapshot !== null && Array.isArray(snapshot.blobs) && snapshot.blobs.length > 0,
  );

  async function fetchSnapshot() {
    loading = true;
    errorMessage = null;

    try {
      const response = await client.getDiagnosticsSnapshot({
        windowSeconds,
        maxBlobs,
        severityThreshold,
      });
      snapshot = response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errorMessage = `Failed to load diagnostics: ${message}`;
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    fetchSnapshot();
  });

  function healthClass(blob: DiagnosticsBlobSummary): string {
    if (blob.health === 'failing') return 'health-tag health-failing';
    if (blob.health === 'degraded') return 'health-tag health-degraded';
    return 'health-tag health-healthy';
  }
</script>

<section>
  <header>
    <h2>Diagnostics snapshot</h2>
    <p>
      Snapshot of recent diagnostics activity grouped by blob, backed by
      <code>DiagnosticsService</code> on <code>example-grpc-server</code>.
    </p>
  </header>

  <div class="controls">
    <label>
      Window (seconds)
      <input
        type="number"
        bind:value={windowSeconds}
        min="10"
        step="10"
      />
    </label>
    <label>
      Max blobs
      <input type="number" bind:value={maxBlobs} min="1" step="1" />
    </label>
    <label>
      Severity threshold
      <select bind:value={severityThreshold}>
        <option value="debug">debug</option>
        <option value="info">info</option>
        <option value="warn">warn</option>
        <option value="error">error</option>
      </select>
    </label>
    <button type="button" onclick={fetchSnapshot} disabled={loading}>
      {loading ? 'Loading…' : 'Refresh snapshot'}
    </button>
  </div>

  {#if snapshot}
    <div class="summary-card">
      <pre>{snapshot.summaryText}</pre>
    </div>
  {/if}

  {#if loading}
    <p class="status-message">Loading diagnostics…</p>
  {:else if errorMessage}
    <p class="status-message error">{errorMessage}</p>
  {:else if hasBlobs && snapshot}
    <table class="blob-table">
      <thead>
        <tr>
          <th>Blob</th>
          <th>Health</th>
          <th>Total events</th>
          <th>Errors</th>
          <th>Warnings</th>
          <th>Avg ms</th>
          <th>P95 ms</th>
          <th>Last error</th>
        </tr>
      </thead>
      <tbody>
        {#each snapshot.blobs as blob}
          <tr>
            <td>{blob.blobName}</td>
            <td>
              <span class={healthClass(blob)}>{blob.health}</span>
            </td>
            <td>{Number(blob.totalEvents)}</td>
            <td>{Number(blob.errorCount)}</td>
            <td>{Number(blob.warnCount)}</td>
            <td>{blob.averageDurationMs.toFixed(1)}</td>
            <td>{blob.p95DurationMs.toFixed(1)}</td>
            <td>{blob.lastErrorMessage || '—'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="status-message">No diagnostics events yet for this window.</p>
  {/if}
</section>
