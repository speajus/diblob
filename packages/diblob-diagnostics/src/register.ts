import type { Container } from '@speajus/diblob';
import { Lifecycle } from '@speajus/diblob';
import { logger } from '@speajus/diblob-logger';
import { DiagnosticsAggregatorImpl } from './aggregator.js';
import { type DiagnosticsWindowConfig, diagnosticsAggregator, diagnosticsRecorder, diagnosticsWindowConfig } from './blobs.js';
import { DiagnosticsRecorderImpl } from './recorder.js';

const DEFAULT_WINDOW_CONFIG: DiagnosticsWindowConfig = {
  windowSeconds: 300,
  maxBlobs: 32,
  severityThreshold: 'info',
  maxEventsPerBlob: 20,
};

export function registerDiagnosticsBlobs(
  container: Container,
  config: Partial<DiagnosticsWindowConfig> = {},
): void {
  const finalConfig: DiagnosticsWindowConfig = { ...DEFAULT_WINDOW_CONFIG, ...config };

  container.register(diagnosticsWindowConfig, () => finalConfig, { lifecycle: Lifecycle.Singleton });

  container.register(
    diagnosticsRecorder,
    DiagnosticsRecorderImpl,
    logger,
    { lifecycle: Lifecycle.Singleton },
  );

  container.register(
    diagnosticsAggregator,
    (rec, cfg, owner) => new DiagnosticsAggregatorImpl(rec, cfg, owner),
    diagnosticsRecorder,
    diagnosticsWindowConfig,
    container,
    { lifecycle: Lifecycle.Singleton },
  );
}

