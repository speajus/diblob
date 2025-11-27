import { createBlob } from '@speajus/diblob';

export type DiagnosticsSeverity = 'debug' | 'info' | 'warn' | 'error';

export interface DiagnosticsEvent {
  blobName: string;
  message: string;
  level: DiagnosticsSeverity;
  timestamp: number; // epoch millis
  context?: Record<string, unknown>;
  durationMs?: number;
  outcome?: 'success' | 'error' | 'unknown';
}

export interface DiagnosticsFetchOptions {
  /** Only include events at or after this timestamp (epoch millis). */
  since: number;
  /** Optional filter for specific blob names. */
  blobNames?: string[];
}

export interface DiagnosticsWindowConfig {
  /** Time window in seconds to consider for snapshots. */
  windowSeconds: number;
  /** Maximum number of blobs to include in a snapshot. */
  maxBlobs: number;
  /** Minimum severity to treat as interesting when computing health. */
  severityThreshold: DiagnosticsSeverity;
  /** Maximum number of events to keep per blob in summaries. */
  maxEventsPerBlob: number;
}

export interface BlobDiagnosticsSummary {
  blobName: string;
  totalEvents: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  debugCount: number;
  successCount: number;
  failureCount: number;
  averageDurationMs?: number;
  p95DurationMs?: number;
  lastErrorMessage?: string;
  lastErrorTimestamp?: string;
  health: 'healthy' | 'degraded' | 'failing';
}

export interface DiagnosticsSnapshot {
  generatedAt: string;
  windowSeconds: number;
  totalEvents: number;
  blobs: BlobDiagnosticsSummary[];
}

export interface DiagnosticsRecorder {
  /** Record a single diagnostics event into the rolling history. */
  record(event: DiagnosticsEvent): void;

  /**
   * Fetch recent events based on time window and optional blob filters.
   * This is intentionally named `fetch*` instead of `get*` to follow local
   * conventions where getters do not take arguments.
   */
  fetchRecentEvents(options: DiagnosticsFetchOptions): DiagnosticsEvent[];
}

export interface DiagnosticsAggregator {
  /** Calculate a snapshot of recent diagnostics for LLMs and UIs. */
  calculateSnapshot(options?: Partial<DiagnosticsWindowConfig>): Promise<DiagnosticsSnapshot>;
}

export const diagnosticsWindowConfig = createBlob<DiagnosticsWindowConfig>('diagnosticsWindowConfig', {
  name: 'Diagnostics Window Configuration',
  description: 'Default configuration for diagnostics snapshots (time window, limits).',
});

export const diagnosticsRecorder = createBlob<DiagnosticsRecorder>('diagnosticsRecorder', {
  name: 'Diagnostics Recorder',
  description: 'In-memory recorder for recent diagnostics events.',
});

export const diagnosticsAggregator = createBlob<DiagnosticsAggregator>('diagnosticsAggregator', {
  name: 'Diagnostics Aggregator',
  description: 'Aggregates diagnostics events into per-blob summaries and snapshots.',
});

