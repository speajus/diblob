# Typed Configuration with `@speajus/diblob-config`

`@speajus/diblob-config` is the recommended way to load **typed, validated
configuration** into your diblob containers. It works in both **Node** and
**browser** environments.

At a high level you:

- Define a TypeScript interface for your configuration.
- Define a runtime schema (using Zod) that matches the interface.
- Create a config blob with `createBlob<AppConfig>()`.
- Use `registerConfigBlob` (or `registerStaticConfigBlob`) to wire it into a
  container.

## Core API

- `EnvironmentName` – `'development' | 'test' | 'staging' | 'production' | string`.
- `ConfigSchema<TConfig>` – minimal schema interface (`parse(input: unknown)`),
  structurally compatible with Zod schemas.
- `LoadConfigOptions<TConfig>` – describes how to load and validate config
  (schema, defaults, env, fileConfig, CLI, environment).
- `loadConfig<TConfig>(options): TConfig` – merges and validates configuration
  without assuming a specific runtime (no direct `process`, `fs`, or `path`).
- `registerConfigBlob(container, blob, options)` – registers a typed config
  blob as a singleton using `loadConfig` under the hood.
- `registerStaticConfigBlob(container, blob, config)` – registers a
  pre-constructed config object as a singleton (great for tests).

## Example: Basic usage with Zod

```ts
import { z } from 'zod';
import { createBlob, createContainer } from '@speajus/diblob';
import {
  type ConfigSchema,
  type EnvironmentName,
  loadConfig,
  registerConfigBlob,
} from '@speajus/diblob-config';

interface AppConfig {
  port: number;
  host: string;
}

const AppConfigSchema = z.object({
  port: z.number().int().min(0).max(65535),
  host: z.string().min(1),
}) satisfies ConfigSchema<AppConfig>;

const appConfig = createBlob<AppConfig>('appConfig');
const container = createContainer();

registerConfigBlob(container, appConfig, {
  schema: AppConfigSchema,
  environment: (process.env.NODE_ENV ?? 'development') as EnvironmentName,
  envPrefix: 'APP_',
  env: process.env,
});
```

Downstream services depend on `AppConfig` via the `appConfig` blob:

```ts
const httpServer = createBlob<HttpServer>('httpServer');

container.register(
  httpServer,
  (cfg: AppConfig) => new HttpServer(cfg.port, cfg.host),
  appConfig,
);
```

## Node helper: `loadNodeConfig`

For Node environments there is a convenience helper that wires in
`process.env`, `process.argv`, and JSON file loading for you:

```ts
import { z } from 'zod';
import { createBlob, createContainer } from '@speajus/diblob';
import {
  type ConfigSchema,
  registerStaticConfigBlob,
} from '@speajus/diblob-config';
import { loadNodeConfig } from '@speajus/diblob-config/node';

interface AppConfig {
  port: number;
  host: string;
}

const AppConfigSchema = z.object({
  port: z.number().int().min(0).max(65535).describe('TCP port for the server.'),
  host: z.string().min(1).describe('Host interface for the server.'),
}) satisfies ConfigSchema<AppConfig>;

const appConfig = createBlob<AppConfig>('appConfig');
const container = createContainer();

const configObject = loadNodeConfig<AppConfig>({
  schema: AppConfigSchema,
  envPrefix: 'APP_',
  file: './config/app.json',
  cliPrefix: 'app-',
});

registerStaticConfigBlob(container, appConfig, configObject);
```

### Example: Telemetry configuration via `@speajus/diblob-config`

`@speajus/diblob-telemetry` exposes a helper that uses `loadNodeConfig` under the
hood and wires the result into the telemetry blobs for you:

```ts
import { createContainer } from '@speajus/diblob';
import { registerTelemetryConfigBlob } from '@speajus/diblob-telemetry';

const container = createContainer();

registerTelemetryConfigBlob(container, {
  envPrefix: 'TELEMETRY_',
  // optional: file, cliPrefix, cliArgs, defaults, environment, env, etc.
});
```

This registers the `telemetryConfig` and `telemetryContext` blobs based on
typed, validated configuration using the shared `TelemetryConfigSchema` inside
`@speajus/diblob-telemetry`.

### What `loadNodeConfig` does

`loadNodeConfig`:

- Derives `environment` from `options.environment` or
  `process.env.NODE_ENV ?? 'development'`.
- Uses `options.env` or `process.env`.
- Optionally reads a JSON file (if `file` is provided) and parses it.
- Uses `options.cliArgs` or `process.argv.slice(2)` when `cliPrefix` is set.
- Calls the environment-agnostic `loadConfig` with these values.

In most Node apps you can call `loadNodeConfig` directly at startup and
register the result via `registerStaticConfigBlob`:

```ts
const configObject = loadNodeConfig<AppConfig>({
  schema: AppConfigSchema,
  envPrefix: 'APP_',
  file: './config/app.json',
  cliPrefix: 'app-',
});

registerStaticConfigBlob(container, appConfig, configObject);
```

## Generating `--help` output from your schema

`@speajus/diblob-config` can generate a CLI help page from your Zod
schema, including descriptions defined via `.describe()`, environment
variable mappings, CLI flags, types, and default values.

At the core is `buildConfigHelpText`:

```ts
import { z } from 'zod';
import { buildConfigHelpText } from '@speajus/diblob-config';

const AppConfigSchema = z.object({
  port: z
    .number()
    .int()
    .min(0)
    .max(65535)
    .describe('TCP port for the server.'),
  host: z
    .string()
    .min(1)
    .describe('Host interface for the server.'),
});

const helpText = buildConfigHelpText<{ port: number; host: string }>({
  schema: AppConfigSchema,
  envPrefix: 'APP_',
  cliPrefix: 'app-',
  defaults: { port: 3000, host: '0.0.0.0' },
  programName: 'my-app',
});

console.log(helpText);
```

This will produce a help block roughly like:

```text
Usage: my-app [options]

Configuration options:

  port
    env:  APP_PORT
    flag: --app-port
    type: number
    default: 3000
    description: TCP port for the server.

  host
    env:  APP_HOST
    flag: --app-host
    type: string
    default: 0.0.0.0
    description: Host interface for the server.
```

### Node helper: `printNodeConfigHelpIfRequested`

For Node CLIs you usually want a simple `--help` flag that prints the
generated text and exits before starting the app. You can use
`printNodeConfigHelpIfRequested` from `@speajus/diblob-config/node`:

```ts
import { z } from 'zod';
import { printNodeConfigHelpIfRequested } from '@speajus/diblob-config/node';

const AppConfigSchema = z.object({
  port: z
    .number()
    .int()
    .min(0)
    .max(65535)
    .describe('TCP port for the server.'),
  host: z
    .string()
    .min(1)
    .describe('Host interface for the server.'),
});

async function main() {
  if (
    printNodeConfigHelpIfRequested<{ port: number; host: string }>({
      schema: AppConfigSchema,
      envPrefix: 'APP_',
      cliPrefix: 'app-',
      programName: 'my-app',
    })
  ) {
    return;
  }

  // normal startup here (load config, start server, etc.)
}
```

## Client usage (Svelte / browser)

On the client you typically have:

- Build-time env like `import.meta.env`.
- Optionally a bootstrapped config object from the server.

You pass those into `loadConfig` or `registerConfigBlob` without any Node
dependencies:

```ts
import { z } from 'zod';
import { createBlob, createContainer } from '@speajus/diblob';
import {
  type ConfigSchema,
  loadConfig,
  registerConfigBlob,
} from '@speajus/diblob-config';

interface FrontendConfig {
  apiBaseUrl: string;
}

const FrontendConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
}) satisfies ConfigSchema<FrontendConfig>;

const frontendConfig = createBlob<FrontendConfig>('frontendConfig');
const container = createContainer();

registerConfigBlob(container, frontendConfig, {
  schema: FrontendConfigSchema,
  environment: 'development',
  envPrefix: 'PUBLIC_APP_',
  env: import.meta.env as Record<string, string | undefined>,
  fileConfig: (window as any).__APP_CONFIG__ ?? {},
});
```

## Merging rules and precedence

`loadConfig` always merges in the following order:

1. `defaults` (if provided).
2. `fileConfig` (if provided and object-like).
3. `env` (respecting `envPrefix` and camelCase normalization).
4. CLI switches (when both `cliPrefix` and `cliArgs` are provided).

Later sources **override** earlier ones. This matches the typical expectation
that command-line switches override env, which override files, which override
defaults.

## Testing with `registerStaticConfigBlob`

In tests you usually want a **deterministic** configuration with no dependence
on `process.env` or the real environment.

```ts
import { createBlob, createContainer } from '@speajus/diblob';
import { registerStaticConfigBlob } from '@speajus/diblob-config';

interface AppConfig {
  port: number;
  host: string;
}

const appConfig = createBlob<AppConfig>('appConfig');

const testContainer = createContainer();

registerStaticConfigBlob(testContainer, appConfig, {
  port: 0,
  host: '127.0.0.1',
});
```

All services that depend on `AppConfig` will now see the test-safe configuration
without touching global process state.

## See also

- [Environment Configuration Quick Start](./ENVIRONMENT_CONFIG_QUICK_START.md)
- [Environment Configuration Guide](./ENVIRONMENT_CONFIGURATION.md)
- [ADR-0002: `@speajus/diblob-config`](../internal/ADR-0002-diblob-config.md)
