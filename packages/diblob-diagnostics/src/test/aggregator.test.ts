import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DiagnosticsAggregatorImpl } from '../aggregator.js';
import type {
	  DiagnosticsEvent,
	  DiagnosticsFetchOptions,
	  DiagnosticsRecorder,
	  DiagnosticsWindowConfig,
	} from '../blobs.js';

class InMemoryRecorder implements DiagnosticsRecorder {
  private readonly events: DiagnosticsEvent[] = [];

  record(event: DiagnosticsEvent): void {
    this.events.push(event);
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
}

const BASE_CONFIG: DiagnosticsWindowConfig = {
  windowSeconds: 300,
  maxBlobs: 10,
  maxEventsPerBlob: 20,
  severityThreshold: 'info',
};

test('DiagnosticsAggregatorImpl calculates basic snapshot', async () => {
  const recorder = new InMemoryRecorder();
  const now = Date.now();

  recorder.record({
    blobName: 'userService',
    level: 'info',
    message: 'ok',
    timestamp: now - 1000,
    outcome: 'success',
    durationMs: 10,
  });

  recorder.record({
    blobName: 'userService',
    level: 'error',
    message: 'boom',
    timestamp: now - 500,
    outcome: 'error',
    durationMs: 20,
  });

  const aggregator = new DiagnosticsAggregatorImpl(recorder, BASE_CONFIG);
  const snapshot = await aggregator.calculateSnapshot({ windowSeconds: 60 });

  assert.equal(snapshot.totalEvents, 2);
  assert.equal(snapshot.blobs.length, 1);
  const userBlob = snapshot.blobs[0];
  assert.equal(userBlob.blobName, 'userService');
  assert.equal(userBlob.errorCount, 1);
  assert.equal(userBlob.successCount, 1);
  assert.equal(userBlob.failureCount, 1);
  assert.ok(userBlob.averageDurationMs && userBlob.averageDurationMs > 0);
});

