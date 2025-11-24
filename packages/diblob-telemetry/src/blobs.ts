import { createBlob } from '@speajus/diblob';

export interface TelemetryConfig {
  serviceName?: string;
  serviceVersion?: string;
  deploymentEnvironment?: string;
  exporter?: 'otlp-http' | 'console' | 'none';
  exporterEndpoint?: string;
  traceSampleRatio?: number;
  enableTraces?: boolean;
  enableMetrics?: boolean;
  enablePaths?: boolean;
}

export interface TelemetryLokiConfig {
  /** If provided, Loki transport will be added to the logger. */
  host?: string;
  labels?: Record<string, string>;
  level?: string;
  interval?: number;
  json?: boolean;
  batching?: boolean;
  enabled?: boolean;
}

export const telemetryLokiConfig = createBlob<TelemetryLokiConfig>('telemetryLokiConfig', {
  name: 'Telemetry Loki Configuration',
});

export interface TelemetryContext {
  tracer: import('@opentelemetry/api').Tracer;
  meter: import('@opentelemetry/api').Meter;
  shutdown: () => Promise<void>;
}

export const telemetryConfig = createBlob<TelemetryConfig>('telemetryConfig', {
  name: 'Telemetry Configuration',
});

export const telemetryContext = createBlob<TelemetryContext>('telemetryContext', {
  name: 'Telemetry Context',
});
