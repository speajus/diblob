/**
 * Core types for diblob dependency injection framework
 */
export const blobPropSymbol = Symbol('blobProp');

/**
 * Metadata that can be attached to blobs and containers
 * for debugging and visualization purposes
 */
export interface BlobMetadata {
  name?: string;
  description?: string;
  [key: string]: any;
}

/**
 * A Blob is a proxy object that acts as both the key and the interface
 * for dependency injection. It can be passed around and will resolve to
 * the registered implementation.
 */
export type Blob<T> = T & {
  readonly [blobPropSymbol]: symbol;
};


export type Ctor<T> = new (...args: any[]) => T;
export type FactoryFn<T> = (...args: any[]) => T | Promise<T>;

/**
 * Factory function or constructor that creates an instance of type T.
 * Can be either:
 * - A constructor: new (...args: any[]) => T
 * - A factory function: (...args: any[]) => T
 * - An async factory function: (...args: any[]) => Promise<T>
 */
export type Factory<T> = Ctor<T> | FactoryFn<T>;
/**
 * Lifecycle options for blob registration
 */
export enum Lifecycle {
  /** Create a new instance every time the blob is resolved */
  Transient = 'transient',
  /** Create a single instance and reuse it (default) */
  Singleton = 'singleton',
}

/**
 * Registration options
 */
export interface RegistrationOptions {
  lifecycle?: Lifecycle;
}

export type FactoryParams<T extends Factory<any>> = T extends new (...args: infer P) => unknown ? P : T extends (...args: infer P) => unknown ? P : never;

export type RegisterParams<T extends Factory<any>> = FactoryParams<T>;

export type FactoryReturnType<T extends Factory<any>> = T extends Factory<infer R> ? R : never;

/**
 * Container interface for managing blob registrations
 */
export interface Container {
  /**
   * Register a blob with a factory/constructor and its dependencies.
   * Dependencies can be blobs (which will be auto-resolved) or plain values.
   *
   * @param blob - The blob to register
   * @param factory - Constructor or factory function
   * @param deps - Dependencies to pass to the factory (blobs will be auto-resolved)
   *
   * @example
   * // With constructor and blob dependencies
   * container.register(userService, UserServiceImpl, logger, database);
   *
   * // With factory function
   * container.register(logger, () => new ConsoleLogger());
   *
   * // With mixed dependencies (blobs and values)
   * container.register(config, ConfigImpl, database, "production");
   */
  register<T, TFactory extends Factory<T>>(blob: Blob<T>, factory:TFactory, ...deps: RegisterParams<TFactory>): void;

  /**
   * Resolve a blob to its implementation.
   * Returns a Promise if the blob or any of its dependencies are async.
   */
  resolve<T>(blob: Blob<T>): T | Promise<T>;

  /**
   * Resolve a class constructor by inspecting its parameters and resolving blob dependencies.
   * Returns a Promise if any dependencies are async.
   */
  resolve<T>(ctor: Ctor<T>): T | Promise<T>;

  /**
   * Check if a blob is registered
   */
  has<T>(blob: Blob<T>): boolean;

  /**
   * Unregister a blob
   */
  unregister<T>(blob: Blob<T>): void;

  /**
   * Clear all registrations
   */
  clear(): void;
}
