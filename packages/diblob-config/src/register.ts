import { type Blob, type Container, Lifecycle } from '@speajus/diblob';
import { loadConfig } from './loader.js';
import type { LoadConfigOptions } from './types.js';

export function registerConfigBlob<TConfig>(
  container: Container,
  blob: Blob<TConfig>,
  options: LoadConfigOptions<TConfig>,
): void {
  container.register(
    blob,
    () => loadConfig(options),
    { lifecycle: Lifecycle.Singleton },
  );
}

export function registerStaticConfigBlob<TConfig>(
  container: Container,
  blob: Blob<TConfig>,
  config: TConfig,
): void {
  container.register(
    blob,
    () => config,
    { lifecycle: Lifecycle.Singleton },
  );
}
