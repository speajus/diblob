/**
 * Core types for diblob dependency injection framework
 */
export const blobPropSymbol = Symbol('blobProp');


/**
	 * Symbol used to attach the owning container to a blob proxy.
	 *
	 * The container is responsible for resolving blob instances and properties.
	 * We only ever set this once per blob ("first registration wins").
	 */
	export const blobContainerSymbol = Symbol('blobContainer');

/**
	 * Symbol used by the container to expose a blob-property resolution method.
	 *
	 * Containers that support blob proxies implement a method keyed by this
	 * symbol with the signature:
	 *   (blob, prop) => unknown
	 */
	export const containerResolveBlobPropSymbol = Symbol('containerResolveBlobProperty');

  /**
	 * Symbol used to attach metadata to a blob proxy.
	 */
export const blobMetadatStoreSymbol = Symbol('blobMetadataStore');


/**
	 * Symbol used by the container to expose a blob-instance resolution method.
	 *
	 * Containers that support blob proxies implement a method keyed by this
	 * symbol with the signature:
	 *   (blob) => instance | Promise<instance>
	 */
	export const containerResolveBlobInstanceSymbol = Symbol('containerResolveBlobInstance');
/**
 * Metadata that can be attached to blobs and containers
 * for debugging and visualization purposes
 */
export interface BlobMetadata {
  name?: string;
  description?: string;
	[key: string]: unknown;
}

/**
 * A Blob is a proxy object that acts as both the key and the interface
 * for dependency injection. It can be passed around and will resolve to
 * the registered implementation.
 */
export type Blob<T> = T & {
  readonly [blobPropSymbol]: symbol;
  [blobContainerSymbol]?: Container;
  readonly [blobMetadatStoreSymbol]?: BlobMetadata;
};

// biome-ignore lint/suspicious/noExplicitAny: it needs any
export type Ctor<T> = new (...args: any[]) => T;
// biome-ignore lint/suspicious/noExplicitAny: it needs any
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

type LifecycleFn<T> = ((instance: T) => void | Promise<void>)
/**
 * Registration options
 */
export interface RegistrationOptions<T> {
  lifecycle: Lifecycle;
  dispose?: LifecycleFn<T> | keyof T;
  initialize?: LifecycleFn<T> | keyof T;
}

// biome-ignore lint/suspicious/noExplicitAny: it needs any
export type FactoryType<T extends Factory<any>> = T extends Factory<infer R> ? R : never;
// biome-ignore lint/suspicious/noExplicitAny: it needs any
export type FactoryParams<T extends Factory<any>> = T extends new (...args: infer P) => unknown ? P : T extends (...args: infer P) => unknown ? P : never;
// biome-ignore lint/suspicious/noExplicitAny: it needs any
export type RegisterParams<T extends Factory<any>> = [...FactoryParams<T>, RegistrationOptions<FactoryType<T>>] | FactoryParams<T>;
// biome-ignore lint/suspicious/noExplicitAny: it needs any
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

  /**
   * Dispose all registered instances and clear the container.
   *
   * Calls any configured dispose hooks for instantiated blobs and
   * then clears all registrations. After this, the container should
   * be treated as no longer usable.
   */
  dispose(): Promise<void>;
}

/**
 * Introspection information for a single blob registration within a container.
 * Consumers like diagnostics and visualizers can use this to build graphs.
 */
export interface ContainerBlobIntrospection {
  blob: Blob<unknown>;
  id: symbol;
  metadata?: BlobMetadata;
  lifecycle: Lifecycle;
  hasInstance: boolean;
  isResolving: boolean;
  dependencies: symbol[];
  dependents: symbol[];
}

/**
 * Introspection snapshot for a container and its registrations.
 */
export interface ContainerIntrospection {
  metadata?: BlobMetadata;
  parents: Container[];
  blobs: ContainerBlobIntrospection[];
}
