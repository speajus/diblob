import { DiagConsoleLogger, DiagLogLevel, diag, metrics } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { AggregationTemporality, MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor, ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import type { Container } from '@speajus/diblob';
import { Lifecycle } from '@speajus/diblob';
import { type TelemetryConfig, type TelemetryContext, telemetryConfig, telemetryContext } from './blobs';

const DEFAULT_CONFIG: TelemetryConfig = {
  serviceName: 'diblob-service',
  exporter: 'console',
  traceSampleRatio: 1.0,
  enableTraces: true,
  enableMetrics: true,
  enablePaths: true,
};

export function registerTelemetryBlobs(
  container: Container,
  config: Partial<TelemetryConfig> = {},
): void {
  const finalConfig: TelemetryConfig = { ...DEFAULT_CONFIG, ...config };

  container.register(telemetryConfig, () => finalConfig, { lifecycle: Lifecycle.Singleton });

  container.register(
    telemetryContext,
    (config) => createTelemetryContext(config),
    telemetryConfig,
    { lifecycle: Lifecycle.Singleton, dispose: (ctx: TelemetryContext) => ctx.shutdown() },
  );
}

function createTelemetryContext(config: TelemetryConfig): TelemetryContext {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName ?? 'diblob-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion ?? '0.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.deploymentEnvironment ?? 'development',
  });

  const tracerProvider = new NodeTracerProvider({
    resource,
    sampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(config.traceSampleRatio ?? 1.0),
    }),
  });

  if (config.enableTraces !== false) {
    const traceExporter = config.exporter === 'otlp-http'
      ? new OTLPTraceExporter(config.exporterEndpoint ? { url: config.exporterEndpoint } : undefined)
      : undefined;

    if (traceExporter) {
      tracerProvider.addSpanProcessor(new BatchSpanProcessor(traceExporter));
    }

    // Always have at least the in-memory tracer; console spans remain via diag for debugging.
  }

  tracerProvider.register();
  const tracer = tracerProvider.getTracer('diblob-telemetry');

  let meter = metrics.getMeter('noop');
  const shutdownFns: Array<() => Promise<void>> = [() => tracerProvider.shutdown()];

  if (config.enableMetrics !== false) {
    const meterProvider = new MeterProvider({ resource });

    if (config.exporter === 'otlp-http') {
      const metricExporter = new OTLPMetricExporter(
        config.exporterEndpoint
          ? { url: config.exporterEndpoint, temporalityPreference: AggregationTemporality.DELTA }
          : { temporalityPreference: AggregationTemporality.DELTA },
      );
      const reader = new PeriodicExportingMetricReader({ exporter: metricExporter });
      meterProvider.addMetricReader(reader);
    }

    meter = meterProvider.getMeter('diblob-telemetry');
    shutdownFns.push(() => meterProvider.shutdown());
  }

  return {
    tracer,
    meter,
    shutdown: async () => {
      for (const fn of shutdownFns) {
        await fn();
      }
    },
  } satisfies TelemetryContext;
}
