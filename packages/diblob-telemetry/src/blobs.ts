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
