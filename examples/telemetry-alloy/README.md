# Telemetry to Grafana Alloy + Tempo + Grafana

This example runs a local observability stack and sends traces from `example-grpc-server` via OTLP to Grafana Alloy, then to Tempo, and views them in Grafana.

## Prereqs
- Docker / Docker Desktop running
- pnpm (per repo convention)

## Start Alloy + Tempo + Prometheus + Loki + Grafana (pre-provisioned data sources)
```bash
cd examples/telemetry-alloy
docker compose up
```

Services:
- Grafana UI: http://localhost:3000 (admin / admin)
- Prometheus UI: http://localhost:9090
- Loki UI/API: http://localhost:3100
- Alloy OTLP: http://localhost:4318 (HTTP) and grpc://localhost:4317
- Alloy metrics scrape endpoint: http://localhost:7777
- Tempo (traces store): http://localhost:3200

## Run the example gRPC server with OTLP export to Alloy
In another shell:
```bash
cd examples/example-grpc-server
TELEMETRY_EXPORTER=otlp-http \
TELEMETRY_ENDPOINT=http://localhost:4318 \
pnpm run dev
```

What happens:
- `example-grpc-server` emits OTLP traces **and metrics** to Alloy (HTTP 4318)
- Alloy forwards traces to Tempo
- Alloy exposes metrics to Prometheus at `http://alloy:7777` (scraped by Prometheus)
- Logs can be sent to Loki (see envs below)
- Grafana is auto-provisioned with Tempo (`http://tempo:3200`), Prometheus (`http://prometheus:9090`), and Loki (`http://loki:3100`) data sources

## Enable log shipping to Loki from example-grpc-server
Set `LOGGER_LOKI_HOST` so the Winston logger adds a Loki transport:
```bash
cd examples/example-grpc-server
LOGGER_LOKI_HOST=http://localhost:3100 \
pnpm run dev
```

Tip: If you run the server in Docker alongside the stack, use `http://loki:3100` instead of `localhost`.

Labels sent by default:
- `service: example-grpc-server`
- `env: DEPLOYMENT_ENVIRONMENT` (default `development`)

Optional envs:
- `LOG_LEVEL` (default `info`)
- `LOG_PRETTY` (set to `false` for JSON console)
- `DEPLOYMENT_ENVIRONMENT` label (default `development`)

Grafana has a basic “Alloy Logs” dashboard pre-provisioned; or use Explore → Loki.

## Log volume (Loki)
- Log volume is enabled in Loki (`limits_config.volume_enabled: true` in `loki/local-config.yaml`).
- In Grafana → Explore → Loki, switch to the **Log Volume** tab and run a query such as `{service="example-grpc-server"}` over the last 15 minutes to see volume.
- Loki HTTP API reference: https://grafana.com/docs/loki/latest/reference/loki-http-api/#query-log-volume

## View traces
1) Open Grafana: http://localhost:3000
2) Add Tempo data source (URL `http://tempo:3200`) if not already added
3) Explore → Tempo → select service `example-grpc-server` → view traces

## Stopping
```bash
cd examples/telemetry-alloy
docker compose down
```