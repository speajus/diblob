import type { Logger } from '@speajus/diblob-logger';
import type { DiagnosticsEvent, DiagnosticsFetchOptions, DiagnosticsRecorder } from './blobs.js';

const MAX_HISTORY_MS = 60 * 60 * 1000; // keep up to 1 hour of history in memory

/**
 * Simple in-memory diagnostics recorder.
 *
 * It stores recent events in a ring-buffer-like array, prunes old entries,
 * and forwards events to the application logger for normal logging.
 */
export class DiagnosticsRecorderImpl implements DiagnosticsRecorder {
  private readonly logger?: Logger;
  private readonly events: DiagnosticsEvent[] = [];

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  record(event: DiagnosticsEvent): void {
    const now = Date.now();
    const normalized: DiagnosticsEvent = {
      ...event,
      timestamp: event.timestamp ?? now,
      outcome: event.outcome ?? 'unknown',
    };

    this.events.push(normalized);
    this.pruneOldEvents(now);
    this.logThroughLogger(normalized);
  }

  fetchRecentEvents(options: DiagnosticsFetchOptions): DiagnosticsEvent[] {
    const { since, blobNames } = options;
    return this.events.filter((event) => {
      if (event.timestamp < since) {
        return false;
      }
      if (blobNames && blobNames.length > 0 && !blobNames.includes(event.blobName)) {
        return false;
      }
      return true;
    });
  }

  private pruneOldEvents(now: number): void {
    const cutoff = now - MAX_HISTORY_MS;
    // Find first index that is within the window
    let firstIndex = 0;
    while (firstIndex < this.events.length && this.events[firstIndex].timestamp < cutoff) {
      firstIndex += 1;
    }
    if (firstIndex > 0) {
      this.events.splice(0, firstIndex);
    }
  }

  private logThroughLogger(event: DiagnosticsEvent): void {
    if (!this.logger) {
      return;
    }

    const meta: Record<string, unknown> = {
      ...(event.context ?? {}),
      diagnostics: true,
      blobName: event.blobName,
      outcome: event.outcome ?? 'unknown',
      durationMs: event.durationMs,
    };

    switch (event.level) {
      case 'error':
        this.logger.error(event.message, meta);
        break;
      case 'warn':
        this.logger.warn(event.message, meta);
        break;
      case 'info':
        this.logger.info(event.message, meta);
        break;
      default:
        this.logger.debug(event.message, meta);
        break;
    }
  }
}

