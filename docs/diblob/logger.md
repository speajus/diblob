# `@speajus/diblob-logger`

Winston-based logger integration for diblob containers.

`@speajus/diblob-logger` provides a configurable [Winston](https://github.com/winstonjs/winston)
logger wired through diblob blobs and containers. It is designed to be configured
via regular diblob patterns (config blobs, registration functions) and to play
well with other packages like `@speajus/diblob-telemetry`.

## Installation

```bash
pnpm add @speajus/diblob-logger @speajus/diblob
```

Requires Node.js >= 22.

## Core ideas

- Logger is exposed via a blob (for example `logger`), not a global.
- Configuration lives in configuration blobs (`LoggerConfig`, `LoggerTransportsConfig`).
- Registration helpers wire up sensible defaults and transports.
- Works well with `@speajus/diblob-config` for typed configuration.

## Basic usage

```ts
import { createBlob, createContainer } from '@speajus/diblob';
import { registerLoggerBlobs, logger } from '@speajus/diblob-logger';

const container = createContainer();

registerLoggerBlobs(container, {
  level: 'info',
});

const appLogger = await container.resolve(logger);
appLogger.info('Server starting');
```

The exact blob names and helper function names may vary; check the
TypeScript types in `@speajus/diblob-logger` for the current API surface.

## Configuration

Typical configuration fields include:

- `level` – minimum log level (e.g. `debug`, `info`, `warn`, `error`).
- `defaultMeta` – default metadata attached to every log.
- `transports` – list of Winston transports (console, file, Loki, etc.).

You can construct this configuration by hand or via `@speajus/diblob-config`:

```ts
import { z } from 'zod';
import { createBlob, createContainer } from '@speajus/diblob';
import { type ConfigSchema, registerConfigBlob } from '@speajus/diblob-config';
import { registerLoggerBlobs, type LoggerConfig } from '@speajus/diblob-logger';

const LoggerConfigSchema = z.object({
  level: z.string().default('info'),
}) satisfies ConfigSchema<LoggerConfig>;

const loggerConfig = createBlob<LoggerConfig>('loggerConfig');
const container = createContainer();

registerConfigBlob(container, loggerConfig, {
  schema: LoggerConfigSchema,
  envPrefix: 'LOGGER_',
  env: process.env,
});

registerLoggerBlobs(container, await container.resolve(loggerConfig));
```

## Telemetry integration

When used together with `@speajus/diblob-telemetry`, you can add a Loki
transport that ships logs to a Loki endpoint. See the telemetry docs for
`registerTelemetryLoggerBlobs`, which wires logger and telemetry together.

## See also

- [`@speajus/diblob-telemetry` docs](./telemetry.md)
- [Typed Configuration with `@speajus/diblob-config`](./config.md)

