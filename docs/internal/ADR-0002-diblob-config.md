# ADR-0002: Introduce `@speajus/diblob-config` for Typed Configuration

## Status
Proposed

## Date
2025-11-24

## Context / Problem
- Configuration in the diblob ecosystem is currently handled ad hoc:
  - Direct `process.env` access in registration functions and examples.
  - Hand-written `loadConfig` helpers in individual apps.
  - "Config service" patterns with string-based keys.
- There is no first-class, reusable configuration library that:
  - Provides strongly typed configuration objects for blobs.
  - Integrates environment variables and optional config files.
  - Performs runtime validation via a schema library.
  - Encodes per-environment behavior (dev, test, staging, prod).
  - Encourages safe defaults for tests and local development.
- This makes it hard to answer "how do I get configuration into my blobs?" with a single, canonical pattern.

## Decision
We will introduce a new package, `@speajus/diblob-config`, that provides:

1. A generic, schema-driven configuration loader:
   - `loadConfig<TConfig>(options): TConfig` which:
     - Starts from defaults (optionally per-environment).
     - Merges values from an optional in-memory config object (typically parsed
       from JSON).
     - Merges values from environment-like key/value records (optionally
       prefixed).
     - Optionally merges values from CLI-style arguments.
     - Validates the merged result against a runtime schema (initially Zod).
     - Returns a strongly typed `TConfig` or throws on validation errors.

2. Container integration helpers that follow existing diblob patterns:
   - `registerConfigBlob(container, blob, options)`
     - Registers a typed configuration blob as a `Lifecycle.Singleton`.
     - Uses `loadConfig` under the hood.
   - `registerStaticConfigBlob(container, blob, config)`
     - Registers a pre-constructed config object as a singleton, for tests and
       simple local setups.

3. A recommended usage pattern where:
   - Applications define a TypeScript interface `AppConfig`.
   - They define a corresponding runtime schema.
   - They create a `createBlob<AppConfig>()` config blob.
   - They call `registerConfigBlob` (or `registerStaticConfigBlob`) during
     container setup.
   - Services depend on `AppConfig` directly, not on raw env or string-key
     config services.
   - They use Zod for schema definition, description and validation.
4. A way to read configuration from environment variables and configuration files.
    So if a user configs `APP_PORT=3000` and `APP_HOST=127.0.0.1` then the
    configuration will be `{ port: 3000, host: '127.0.0.1' }`.  In addition they should be able to have an Env prefix like `APP_` so that the user can do `APP_PORT=3000` and `APP_HOST=127.0.0.1` and the configuration will be `{ port: 3000, host: '127.0.0.1' }`.  The prefix is to avoid collisions with other environment variables.  The prefix is configurable.
5. It should be able to parse command line swithes with `--` like `--app-port=3000` and `--app-host=127.0.0.1` and the configuration will be `{ port: 3000, host: '127.0.0.1' }`.  This is to allow for easy testing and debugging.  The prefix is configurable.

## Design Overview

### Schema and environment abstraction

We introduce the following core types:
- `EnvironmentName` – `'development' | 'test' | 'staging' | 'production' | string`.
- `ConfigSchema<TConfig>` – wrapper type around the chosen schema library.
- `LoadConfigOptions<TConfig>` – describes how to load and validate config
  (schema, env, file, defaults, environment).

The initial implementation will use **Zod** under the hood, but the public
surface will refer to `ConfigSchema<TConfig>` so we can later swap to Valibot
or another runtime schema library if desired.

### `loadConfig`

`loadConfig<TConfig>(options: LoadConfigOptions<TConfig>): TConfig` will:
1. Determine `environment` from `options.environment` (defaulting to
   `"development"`).
2. Start from `defaults` (object or function of `environment`).
3. Overlay values from an optional `fileConfig` object (often parsed from a
   JSON file on the server or provided by the host environment on the
   client).
4. Overlay values derived from an `env` record (with optional prefix
   filtering and normalization from `SOME_PREFIX_KEY` to `someKey`).
5. Optionally overlay values derived from CLI-style arguments when
   `cliPrefix` and `cliArgs` are provided.
6. Pass the merged raw object to `schema.parse`.
7. Return the validated `TConfig` or throw a descriptive validation error.

Precedence: `defaults < file < env < command line switches` (switches wins).

### `registerConfigBlob`

`registerConfigBlob` wires the loader into a container as a singleton
configuration blob:

````ts
registerConfigBlob(container, appConfigBlob, {
  schema: AppConfigSchema,
  envPrefix: 'APP_',
  environment: process.env.NODE_ENV ?? 'development',
  defaults: (env) => env === 'test' ? testDefaults : prodDefaults,
});
````

Services then depend on the typed `AppConfig` interface via the blob, rather
than directly on env or ad hoc helpers.

### `registerStaticConfigBlob`

`registerStaticConfigBlob` supports tests and simple local setups by
registering an already-constructed configuration object:

````ts
registerStaticConfigBlob(container, appConfigBlob, {
  port: 0,
  host: '127.0.0.1',
});
````

This avoids coupling tests to `process.env` and makes it trivial to inject
known-safe defaults.

## Rationale

- **Unification:** Today, each example and package rolls its own configuration
  story. A dedicated package gives a single answer: use
  `@speajus/diblob-config`.
- **Type safety:** Injecting a typed `TConfig` object is safer and more
  maintainable than scattered `process.env` reads or string-key lookup
  services.
- **Validation:** Runtime schemas (initially Zod) provide consistent error
  messages and default handling, and keep validation logic close to the shape
  definition.
- **Testability:** Being able to inject a static config or a synthetic `env`
  object makes tests more reliable and less coupled to process-wide state.
- **Alignment with existing patterns:** The design mirrors existing packages
  such as `@speajus/diblob-logger` and `@speajus/diblob-telemetry`, which
  expose "register*Blobs" helpers.

## Consequences

### Positive
- Clear, documented configuration story for all diblob-based applications.
- Stronger typing of configuration throughout services.
- Centralized, reusable implementation of env/file/defaults merging.
- Easier testing by avoiding direct `process.env` dependence in services.

### Negative / tradeoffs
- New dependency on a schema library (Zod initially), with some startup cost
  for parsing and validation.
- Users must learn the schema DSL to define their configuration.
- Misconfigured environments will now fail fast at startup rather than being
  silently tolerated (intended but behavior-changing).

## Implementation Plan

1. Create `packages/diblob-config` with the same build/test conventions as
   other packages.
2. Introduce `ConfigSchema`, `EnvironmentName`, `LoadConfigOptions`, and
   `loadConfig` in `src/`.
3. Implement `registerConfigBlob` and `registerStaticConfigBlob` following the
   patterns used in `diblob-logger` and `diblob-telemetry`.
4. Add node:test-based tests covering:
   - Env-only configuration.
   - Env + defaults + environment-specific behavior.
   - File + env precedence.
   - Validation failures.
5. Update public environment-configuration docs to reference
   `@speajus/diblob-config` as the recommended approach.
6. Update examples to use @speajus/diblob-config for configuration.  
  - Update example-grpc-server  
  - Update example-web-svelte
  - Update diblob-visualizer if needed adding registerConfigBlob
  - Update diblob-telemetry if needed
  - Update diblob-logger if needed
  - Update diblob-connect if needed
  - Update diblob-svelte if needed
  - Update diblob-mcp if needed
  - Update diblob-visualizer if needed

  
