import type { Span } from '@opentelemetry/api';
import type { Container } from '@speajus/diblob';
import { type TelemetryContext, telemetryContext } from '@speajus/diblob-telemetry';
import type {
	  BlobDiagnosticsSummary,
	  DiagnosticsAggregator,
	  DiagnosticsEvent,
	  DiagnosticsRecorder,
	  DiagnosticsSnapshot,
	  DiagnosticsWindowConfig,
	} from './blobs.js';

	const DEFAULT_WINDOW_SECONDS = 300; // 5 minutes
	const DEFAULT_MAX_BLOBS = 32;
	const DEFAULT_MAX_EVENTS_PER_BLOB = 20;
	const DEFAULT_SEVERITY: DiagnosticsWindowConfig['severityThreshold'] = 'info';

	export class DiagnosticsAggregatorImpl implements DiagnosticsAggregator {
		  private readonly recorder: DiagnosticsRecorder;
		  private readonly baseConfig: DiagnosticsWindowConfig;
		  private readonly container?: Container;
		  private telemetry?: TelemetryContext | null;

  constructor(recorder: DiagnosticsRecorder, baseConfig: DiagnosticsWindowConfig, container?: Container) {
    this.recorder = recorder;
    this.baseConfig = baseConfig;
    this.container = container;
    this.telemetry = null;
  }

  async calculateSnapshot(overrides?: Partial<DiagnosticsWindowConfig>): Promise<DiagnosticsSnapshot> {
    const config = this.mergeConfig(overrides);
    const now = Date.now();
    const since = now - config.windowSeconds * 1000;

    const span = await this.startSpanSafe('diblob.diagnostics.calculate_snapshot');
    try {
      const events = this.recorder.fetchRecentEvents({ since });
      const blobs = this.buildBlobSummaries(events, config);

      const trimmedBlobs = blobs
        .sort((a, b) => this.compareBySeverityAndErrors(b, a))
        .slice(0, config.maxBlobs);

      const snapshot: DiagnosticsSnapshot = {
        generatedAt: new Date(now).toISOString(),
        windowSeconds: config.windowSeconds,
        totalEvents: events.length,
        blobs: trimmedBlobs,
      };

      if (span) {
        span.setAttribute('diblob.diagnostics.blob_count', snapshot.blobs.length);
        span.setAttribute('diblob.diagnostics.total_events', snapshot.totalEvents);
      }

      return snapshot;
    } finally {
      span?.end();
    }
  }

  private mergeConfig(overrides?: Partial<DiagnosticsWindowConfig>): DiagnosticsWindowConfig {
    const base = this.baseConfig ?? {
      windowSeconds: DEFAULT_WINDOW_SECONDS,
      maxBlobs: DEFAULT_MAX_BLOBS,
      maxEventsPerBlob: DEFAULT_MAX_EVENTS_PER_BLOB,
      severityThreshold: DEFAULT_SEVERITY,
    };

    return {
      windowSeconds: overrides?.windowSeconds ?? base.windowSeconds ?? DEFAULT_WINDOW_SECONDS,
      maxBlobs: overrides?.maxBlobs ?? base.maxBlobs ?? DEFAULT_MAX_BLOBS,
      maxEventsPerBlob: overrides?.maxEventsPerBlob ?? base.maxEventsPerBlob ?? DEFAULT_MAX_EVENTS_PER_BLOB,
      severityThreshold: overrides?.severityThreshold ?? base.severityThreshold ?? DEFAULT_SEVERITY,
    };
  }

  private buildBlobSummaries(events: DiagnosticsEvent[], config: DiagnosticsWindowConfig): BlobDiagnosticsSummary[] {
    const byBlob = new Map<string, DiagnosticsEvent[]>();
    for (const event of events) {
      const list = byBlob.get(event.blobName) ?? [];
      list.push(event);
      byBlob.set(event.blobName, list);
    }

    const result: BlobDiagnosticsSummary[] = [];
    for (const [blobName, blobEvents] of byBlob.entries()) {
      result.push(this.summarizeBlob(blobName, blobEvents, config));
    }
    return result;
  }

  private summarizeBlob(
    blobName: string,
    events: DiagnosticsEvent[],
    config: DiagnosticsWindowConfig,
  ): BlobDiagnosticsSummary {
    let errorCount = 0;
    let warnCount = 0;
    let infoCount = 0;
    let debugCount = 0;
    let successCount = 0;
    let failureCount = 0;
    const durations: number[] = [];

    let lastErrorMessage: string | undefined;
    let lastErrorTimestamp: string | undefined;

    const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);

    for (const event of sorted) {
      switch (event.level) {
        case 'error':
          errorCount += 1;
          lastErrorMessage = event.message;
          lastErrorTimestamp = new Date(event.timestamp).toISOString();
          break;
        case 'warn':
          warnCount += 1;
          break;
        case 'info':
          infoCount += 1;
          break;
        default:
          debugCount += 1;
          break;
      }

      if (event.outcome === 'success') {
        successCount += 1;
      } else if (event.outcome === 'error') {
        failureCount += 1;
      }

      if (typeof event.durationMs === 'number') {
        durations.push(event.durationMs);
      }
    }

    const averageDurationMs = durations.length > 0
      ? durations.reduce((sum, v) => sum + v, 0) / durations.length
      : undefined;

    const p95DurationMs = durations.length > 0
      ? this.computePercentile(durations, 0.95)
      : undefined;

    const health = this.calculateHealth({
      errorCount,
      warnCount,
      total: events.length,
      severityThreshold: config.severityThreshold,
    });

    const limitedEvents = events.length > config.maxEventsPerBlob
      ? events.slice(events.length - config.maxEventsPerBlob)
      : events;

    // We currently do not export the raw events, but we may want them later for UIs.
    void limitedEvents;

    return {
      blobName,
      totalEvents: events.length,
      errorCount,
      warnCount,
      infoCount,
      debugCount,
      successCount,
      failureCount,
      averageDurationMs,
      p95DurationMs,
      lastErrorMessage,
      lastErrorTimestamp,
      health,
    };
  }

  private computePercentile(values: number[], percentile: number): number {
    if (values.length === 0) {
      return 0;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.floor(percentile * sorted.length));
    return sorted[index];
  }

  private calculateHealth(params: {
    errorCount: number;
    warnCount: number;
    total: number;
    severityThreshold: DiagnosticsWindowConfig['severityThreshold'];
  }): 'healthy' | 'degraded' | 'failing' {
    const { errorCount, warnCount, total, severityThreshold } = params;
    if (total === 0) {
      return 'healthy';
    }

    const errorRatio = errorCount / total;
    const warnRatio = warnCount / total;

    if (errorRatio > 0.1) {
      return 'failing';
    }
    if (severityThreshold === 'warn' && warnRatio > 0.2) {
      return 'degraded';
    }
    return 'healthy';
  }

  private compareBySeverityAndErrors(a: BlobDiagnosticsSummary, b: BlobDiagnosticsSummary): number {
    const severityOrder: Record<BlobDiagnosticsSummary['health'], number> = {
      failing: 2,
      degraded: 1,
      healthy: 0,
    };
    const severityDiff = severityOrder[a.health] - severityOrder[b.health];
    if (severityDiff !== 0) {
      return severityDiff;
    }
    return a.errorCount - b.errorCount;
  }

		  private async startSpanSafe(name: string): Promise<Span | undefined> {
		    if (!this.container) {
		      return undefined;
		    }

		    try {
		      // Resolve telemetry from the container the first time we need it so
		      // diagnostics can still operate even if telemetry isn't registered.
		      if (this.telemetry === null) {
		        const maybeTelemetry = await this.container.resolve(telemetryContext);
		        this.telemetry = maybeTelemetry ?? undefined;
		      }
		    } catch {
		      this.telemetry = undefined;
		    }

		    if (!this.telemetry) {
		      return undefined;
		    }

		    return this.telemetry.tracer.startSpan(name);
		  }
		}

/**
 * Render a human-readable summary string suitable for feeding into an LLM.
 */
export function renderDiagnosticsSummaryText(snapshot: DiagnosticsSnapshot): string {
  const lines: string[] = [];
  lines.push(`Diagnostics snapshot (last ${snapshot.windowSeconds}s, ${snapshot.totalEvents} events)`);

  for (const blob of snapshot.blobs) {
    lines.push(
      `- ${blob.blobName}: health=${blob.health}, errors=${blob.errorCount}, warnings=${blob.warnCount}, total=${blob.totalEvents}`,
    );
    if (blob.lastErrorMessage) {
      lines.push(`  last error: ${blob.lastErrorMessage}`);
    }
  }

  return lines.join('\n');
}

