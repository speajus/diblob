import { DiagConsoleLogger, DiagLogLevel, diag, metrics } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { AggregationTemporality, MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor, ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ATTR_DEPLOYMENT_ENVIRONMENT } from '@opentelemetry/semantic-conventions/incubating';

import type { Container } from '@speajus/diblob';
import { Lifecycle } from '@speajus/diblob';
import type { NodeConfigOptions } from '@speajus/diblob-config/node';
import { loadNodeConfig } from '@speajus/diblob-config/node';
import type { LoggerConfig } from '@speajus/diblob-logger';
import { loggerTransports, registerLoggerBlobs } from '@speajus/diblob-logger';
import LokiTransport from 'winston-loki';
import { type TelemetryConfig, type TelemetryContext, type TelemetryLokiConfig, telemetryConfig, telemetryContext, telemetryLokiConfig } from './blobs';
import { TelemetryConfigSchema } from './config.js';

const DEFAULT_CONFIG: TelemetryConfig = {
	serviceName: 'diblob-service',
	exporter: 'console',
	traceSampleRatio: 1.0,
	enableTraces: true,
	enableMetrics: true,
	enablePaths: true,
};

type TelemetryNodeConfigOptions = Omit<NodeConfigOptions<TelemetryConfig>, 'schema'>;

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

const DEFAULT_TELEMETRY_LOGGER_CONFIG: LoggerConfig = {
	level: 'info',
	prettyPrint: true,
};

const DEFAULT_TELEMETRY_LOKI_CONFIG: TelemetryLokiConfig = {};

export function registerTelemetryLoggerBlobs(
	container: Container,
	loggerCfg: Partial<LoggerConfig> = {},
	lokiCfg?: TelemetryLokiConfig,
): void {
	const mergedLoggerCfg: LoggerConfig = { ...DEFAULT_TELEMETRY_LOGGER_CONFIG, ...loggerCfg };
	const mergedLokiCfg: TelemetryLokiConfig = { ...DEFAULT_TELEMETRY_LOKI_CONFIG, ...lokiCfg };

	// Base logger config blob from diblob-logger (registers loggerConfig, loggerTransports, logger)
	registerLoggerBlobs(container, mergedLoggerCfg);

	// Loki config blob lives here (telemetry), not in diblob-logger
	container.register(telemetryLokiConfig, () => mergedLokiCfg, { lifecycle: Lifecycle.Singleton });

	// Push Loki transport to the transports list when enabled
	if (mergedLokiCfg?.host && (mergedLokiCfg.enabled ?? true)) {
		loggerTransports.push(
			new LokiTransport({
				host: mergedLokiCfg.host,
				labels: mergedLokiCfg.labels,
				level: mergedLokiCfg.level ?? mergedLoggerCfg.level ?? 'info',
				batching: mergedLokiCfg.batching ?? true,
				interval: mergedLokiCfg.interval ?? 1000,
				json: mergedLokiCfg.json ?? true,
			}),
		);
	}
}

export function registerTelemetryConfigBlob(
	container: Container,
	options: TelemetryNodeConfigOptions,
): void {
	const config = loadNodeConfig<TelemetryConfig>({
		schema: TelemetryConfigSchema,
		...options,
	});

	registerTelemetryBlobs(container, config);
}

function createTelemetryContext(config: TelemetryConfig): TelemetryContext {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.serviceName ?? 'diblob-service',
    [ATTR_SERVICE_VERSION]: config.serviceVersion ?? '0.0.0',
    [ATTR_DEPLOYMENT_ENVIRONMENT]: config.deploymentEnvironment ?? 'development',
  });

  // Configure span processors
  const spanProcessors = [];
  if (config.enableTraces !== false) {
    const traceExporter = config.exporter === 'otlp-http'
      ? new OTLPTraceExporter(config.exporterEndpoint ? { url: config.exporterEndpoint } : undefined)
      : undefined;

    if (traceExporter) {
      spanProcessors.push(new BatchSpanProcessor(traceExporter));
    }
  }

  const tracerProvider = new NodeTracerProvider({
    resource,
    sampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(config.traceSampleRatio ?? 1.0),
    }),
    spanProcessors,
  });

  tracerProvider.register();
  const tracer = tracerProvider.getTracer('diblob-telemetry');

  let meter = metrics.getMeter('noop');
  const shutdownFns: Array<() => Promise<void>> = [() => tracerProvider.shutdown()];

  if (config.enableMetrics !== false) {
    // Configure metric readers
    const readers = [];
    if (config.exporter === 'otlp-http') {
      const metricExporter = new OTLPMetricExporter(
        config.exporterEndpoint
          ? { url: config.exporterEndpoint, temporalityPreference: AggregationTemporality.DELTA }
          : { temporalityPreference: AggregationTemporality.DELTA },
      );
      readers.push(new PeriodicExportingMetricReader({ exporter: metricExporter }));
    }

    const meterProvider = new MeterProvider({ resource, readers });

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
