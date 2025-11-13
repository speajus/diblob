/**
 * DI Container implementation
 */

	import { BlobNotReadyError, beginConstructorTracking, blobHandlers, blobInstanceGetters, endConstructorTracking, getBlobId, isBlob, isTrackingConstructor, setBlobContainer } from './blob.js';
import {
  beginTracking,
  clearAllDependencies,
  clearDependencies,
  endTracking,
  getDependents,
  trackDependency,
	} from './reactive.js';
	import type { Blob, BlobMetadata, Ctor, Factory, FactoryFn, FactoryParams, Container as IContainer, RegisterParams, RegistrationOptions } from './types.js';
	import { blobPropSymbol, Lifecycle } from './types.js';

interface Registration<T = unknown> {
  factory: Factory<T>;
  deps: unknown[];
  lifecycle: Lifecycle;
  instance?: T;
  resolving?: boolean; // Track if currently being resolved (for cyclic dependency detection)
  dispose?: ((v:T) => void | Promise<void>) | (string & keyof T);
  initialize?: ((v:T) => void | Promise<void>) | (string & keyof T);
}

/**
 * WeakMap to store container metadata
 */
const containerMetadataStore = new WeakMap<Container, BlobMetadata>();

/**
 * Default DI container implementation
 */
export class Container implements IContainer {
  private registrations = new Map<symbol, Registration>();
  private parents: Container[] = [];

  constructor(parents: Container[] = [], metadata?: BlobMetadata) {
    this.parents = parents;

    // Store metadata if provided
    if (metadata) {
      containerMetadataStore.set(this, metadata);
    }
  }

	  register<T, TFactory extends Factory<T>>(blob: Blob<T>, factory: Factory<T>, ...deps: RegisterParams<TFactory>): void {
    const blobId = getBlobId(blob);

    // Track which container registered this blob (first registration wins)
    setBlobContainer(blobId, this);

	    // Extract lifecycle option if the last dep is a RegistrationOptions object
	    let lifecycle = Lifecycle.Singleton;
	    let dispose: Registration<T>["dispose"];
	    let initialize: Registration<T>["initialize"];
    let actualDeps = [] as unknown as FactoryParams<TFactory>

	    if (deps.length > 0) {
	      const lastDep = deps[deps.length - 1];
	      if (isLifecycleOption(lastDep)) {
	        const options = lastDep as RegistrationOptions<T>;
	        lifecycle = options.lifecycle ?? Lifecycle.Singleton;
	        dispose = options.dispose;
	        initialize = options.initialize;
	        actualDeps = deps.slice(0, -1) as FactoryParams<TFactory>;
	      } else {
	        actualDeps = deps as FactoryParams<TFactory>;
	      }
	    }

    // If re-registering, invalidate the old instance and its dependents
    if (this.registrations.has(blobId)) {
      this.invalidate(blobId);
    }

    // Register the handler for this blob
    blobHandlers.set(blobId, (prop: string | symbol) => {
      // Preserve the blob ID
      if (prop === blobPropSymbol) {
        return blobId;
      }

      // Track this dependency
      trackDependency(blobId);

      // Resolve the actual instance
      let instance: T | Promise<T>;
      try {
        instance = this.resolve(blob);
      } catch (error) {
        // If we caught a BlobNotReadyError, wait for the promise and retry
        if (error instanceof BlobNotReadyError) {
          // If we're tracking constructors, re-throw so resolveConstructor can handle it
          if (isTrackingConstructor()) {
            throw error;
          }
          // Otherwise, wait for the promise and then retry resolving this blob
          return error.promise.then(() => {
            // The async dependency should now be cached
            // Retry resolving this blob
            const resolved = this.resolve(blob);
            // If it's still a promise, wait for it
            if (resolved instanceof Promise) {
              return resolved.then((r) => {
                // biome-ignore lint/suspicious/noExplicitAny: we know what it is.
                const value = (r as any)[prop];
                if (typeof value === 'function') {
                  return value.bind(r);
                }
                return value;
              });
            }
            // Access the property on the resolved instance
            // biome-ignore lint/suspicious/noExplicitAny: we know what it is.
            const value = (resolved as any)[prop];
            if (typeof value === 'function') {
              return value.bind(resolved);
            }
            return value;
          });
        }
        throw error;
      }

      // Handle async resolution
      if (instance instanceof Promise) {
        return instance.then((resolved) => {

          // biome-ignore lint/suspicious/noExplicitAny: we know what it is.
              const value = (resolved as any)[prop];
          if (typeof value === 'function') {
            return value.bind(resolved);
          }
          return value;
        });
      }

      // Forward the property access to the instance
      // biome-ignore lint/suspicious/noExplicitAny: we know what it is.
      const value = (instance as any)[prop];

      // Bind methods to the instance
      if (typeof value === 'function') {
        return value.bind(instance);
      }

      return value;
    });

    // Register the instance getter for property setters
    blobInstanceGetters.set(blobId, () => {
      return this.resolve(blob);
    });

	    this.registrations.set(blobId, {
	      factory,
	      deps: actualDeps,
	      lifecycle,
	      dispose,
	      initialize,
	    });
  }

  resolve<T>(blobOrConstructor: Blob<T> | Ctor<T>): T | Promise<T> {
    // Check if it's a blob or a constructor
    if (isBlob(blobOrConstructor)) {
      try {
        return this.resolveBlob(blobOrConstructor as Blob<T>);
      } catch (error) {
        // If resolveBlob throws BlobNotReadyError, return the promise
        // The promise already resolves to the fully resolved instance
        if (error instanceof BlobNotReadyError) {
          return error.promise as Promise<T>;
        }
        throw error;
      }
    } else {
      return this.resolveConstructor(blobOrConstructor );
    }
  }

  private resolveBlob<T>(blob: Blob<T>): T | Promise<T> {
    const blobId = getBlobId(blob);
    const registration = this.registrations.get(blobId);

    // If not found in this container, check parent containers (last parent wins)
    if (!registration) {
      for (let i = this.parents.length - 1; i >= 0; i--) {
        const parent = this.parents[i];
        if (parent.has(blob)) {
          return parent.resolveBlob(blob);
        }
      }
      throw new Error('Blob not registered. Call container.register() first.');
    }

    // Detect cyclic dependency - if already resolving, return the blob itself
    // The blob proxy will forward to the instance once it's created
    // BUT: if the instance is already cached, return it even if still resolving
    // This allows retries after async resolution to work correctly
    if (registration.resolving) {
      // Check if instance is cached (might be cached by async resolution)
      if (registration.lifecycle === Lifecycle.Singleton && registration.instance) {
        return registration.instance as T;
      }
      return blob as unknown as T;
    }

    // For singleton lifecycle, return cached instance if available
    if (registration.lifecycle === Lifecycle.Singleton && registration.instance) {
      return registration.instance as T;
    }

    // Mark as resolving to detect cycles
    registration.resolving = true;

    // Track dependencies during resolution
    beginTracking(blobId);

    try {
      // Resolve all dependencies
      const resolvedDeps = registration.deps.map((dep) => {
        if (isBlob(dep)) {
          // It's a blob - track it as a dependency and resolve it
          const depId = getBlobId(dep);
          trackDependency(depId);
          try {
            return this.resolveBlob(dep);
          } catch (error) {
            // If the dependency throws BlobNotReadyError, treat it as a Promise
            if (error instanceof BlobNotReadyError) {
              return error.promise;
            }
            throw error;
          }
        } else {
          // It's a plain value - use it directly
          return dep;
        }
      });

      // Check if any dependencies are promises
      const hasAsyncDeps = resolvedDeps.some((dep) => dep instanceof Promise);

      if (hasAsyncDeps) {
        // Create the promise that will resolve all dependencies
        const asyncResolution = Promise.all(resolvedDeps).then((deps) => {
          const instance = this.instantiate(registration.factory, deps);

          // Handle async factory
          if (instance instanceof Promise) {
            return instance.then((resolved) => {
              // Call initialize if defined
              const initResult = this.callLifecycleMethod(resolved, registration.initialize);
              if (initResult instanceof Promise) {
                return initResult.then(() => {
                  if (registration.lifecycle === Lifecycle.Singleton) {
                    registration.instance = resolved;
                  }
                  registration.resolving = false;
                  return resolved;
                });
              }

              if (registration.lifecycle === Lifecycle.Singleton) {
                registration.instance = resolved;
              }
              registration.resolving = false;
              return resolved;
            });
          }

          // Call initialize if defined
          const initResult = this.callLifecycleMethod(instance, registration.initialize);
          if (initResult instanceof Promise) {
            return initResult.then(() => {
              if (registration.lifecycle === Lifecycle.Singleton) {
                registration.instance = instance;
              }
              registration.resolving = false;
              return instance;
            });
          }

          if (registration.lifecycle === Lifecycle.Singleton) {
            registration.instance = instance;
          }
          registration.resolving = false;
          return instance;
        }) as Promise<T>;

        // Clean up tracking before throwing
        endTracking();
        // DON'T set registration.resolving = false here - let the promise handler do it
        // Otherwise, retries will create new promises instead of using the cached instance

        // Throw BlobNotReadyError so the blob handler can catch it
        // The blob handler will decide whether to re-throw or wait based on context
        throw new BlobNotReadyError(asyncResolution);
      }

      // Sync resolution
      const instance = this.instantiate(registration.factory, resolvedDeps);

      // Handle async factory in sync context
      if (instance instanceof Promise) {
        return instance.then((resolved) => {
          // Call initialize if defined
          const initResult = this.callLifecycleMethod(resolved, registration.initialize);
          if (initResult instanceof Promise) {
            return initResult.then(() => {
              if (registration.lifecycle === Lifecycle.Singleton) {
                registration.instance = resolved;
              }
              registration.resolving = false;
              return resolved;
            });
          }

          if (registration.lifecycle === Lifecycle.Singleton) {
            registration.instance = resolved;
          }
          registration.resolving = false;
          return resolved;
        }) as Promise<T>;
      }

      // Call initialize if defined
      const initResult = this.callLifecycleMethod(instance, registration.initialize);
      if (initResult instanceof Promise) {
        return initResult.then(() => {
          // Cache singleton instances
          if (registration.lifecycle === Lifecycle.Singleton) {
            registration.instance = instance;
          }
          registration.resolving = false;
          return instance as T;
        }) as Promise<T>;
      }

      // Cache singleton instances
      if (registration.lifecycle === Lifecycle.Singleton) {
        registration.instance = instance;
      }

      registration.resolving = false;
      return instance as T;
    } finally {
      endTracking();
    }
  }

  private resolveConstructor<T>(ctor: Ctor<T>): T | Promise<T> {
    // Begin tracking blob accesses during constructor execution
    beginConstructorTracking();

    let instance: T | undefined;
    let asyncPromise: Promise<unknown> | null = null;

    try {
      // Instantiate the constructor - any blob default parameters will be tracked
      instance = new ctor();
    } catch (error) {
      // Check if this is a BlobNotReadyError (async dependency)
      if (error instanceof BlobNotReadyError) {
        asyncPromise = error.promise;
      } else {
        // Make sure to end tracking even if there's an error
        endConstructorTracking();
        throw error;
      }
    }

    // Get the blobs that were accessed during construction
    const blobDeps = endConstructorTracking();

    // If we caught an async dependency error, resolve all blob dependencies
    if (asyncPromise) {
      // Resolve all blob dependencies that were tracked
      const resolvedDeps = blobDeps.map(blob => this.resolveBlob(blob));
      // Wait for all of them (including the one that threw the error)
      return Promise.all(resolvedDeps).then(() => {
        // Re-instantiate - all async blobs should now be resolved and cached
        return new ctor();
      }) as Promise<T>;
    }

    // Collect all blob dependencies (both accessed and stored in instance properties)
    const allBlobDeps = [...blobDeps];

    // Check instance properties for blob proxies that weren't accessed during construction
    if (instance) {
      for (const key in instance) {
        const value = instance[key];
        if (isBlob(value) && !allBlobDeps.includes(value)) {
          allBlobDeps.push(value);
        }
      }
    }

    // If any blobs were accessed or stored, we need to check if they're async
    if (allBlobDeps.length > 0) {
      // Resolve all blob dependencies to check for async
      const resolvedDeps = allBlobDeps.map(blob => {
        try {
          return this.resolveBlob(blob);
        } catch (error) {
          if (error instanceof BlobNotReadyError) {
            return error.promise;
          }
          throw error;
        }
      });
      const hasAsyncDeps = resolvedDeps.some(dep => dep instanceof Promise);

      if (hasAsyncDeps) {
        // If there are async dependencies, wait for them to fully resolve
        // This ensures they're cached before we re-instantiate
        return Promise.all(resolvedDeps).then(() => {
          // Re-instantiate - blobs are now resolved and cached as singletons
          // so they'll return the actual instances instead of promises
          return new ctor();
        });
      }
    }

    // No async dependencies, return the instance
    // At this point instance must be defined (no async error was thrown)
    return instance as T;
  }

  private instantiate<K, T extends Factory<K>>(factory:T, deps: FactoryParams<T>): K | Promise<K>{
    // Check if it's a constructor (has prototype)
    if (isCtor(factory)) {
      // If there are no dependencies, use resolveConstructor to handle blob default parameters
      if (deps.length === 0) {
        return this.resolveConstructor(factory) as K | Promise<K>;
      }
      // Otherwise, use 'new' with the provided dependencies
      return new factory(...deps);
    } else if (isFactoryFn(factory)) {
      // It's a factory function - call it directly
      return factory(...deps);
    }else{
      throw new Error('Invalid factory');
    }
  }

  has<T>(blob: Blob<T>): boolean {
    const blobId = getBlobId(blob);

    // Check this container first
    if (this.registrations.has(blobId)) {
      return true;
    }

    // Check parent containers
    for (const parent of this.parents) {
      if (parent.has(blob)) {
        return true;
      }
    }

    return false;
  }

  unregister<T>(blob: Blob<T>): void {
    const blobId = getBlobId(blob);
    this.invalidate(blobId);
    this.registrations.delete(blobId);
    blobHandlers.delete(blobId);
  }

	  async dispose(): Promise<void> {
	    const disposePromises: Promise<void>[] = [];

	    for (const registration of this.registrations.values()) {
	      if (registration.instance && registration.dispose) {
	        try {
	          const result = this.callLifecycleMethod(registration.instance, registration.dispose);
	          if (result instanceof Promise) {
	            const handled = result.catch((error) => {
	              console.error('Error in dispose method:', error);
	            });
	            disposePromises.push(handled);
	          }
	        } catch (error) {
	          console.error('Error in dispose method:', error);
	        }

	        delete registration.instance;
	      }
	    }

	    // Clear registrations, blob handlers, and dependency tracking
	    this.clear();

	    if (disposePromises.length > 0) {
	      await Promise.all(disposePromises);
	    }
	  }
	
  clear(): void {
    this.registrations.clear();
    blobHandlers.clear();
    clearAllDependencies();
  }

  /**
   * Call a lifecycle method (initialize or dispose) on an instance
   */
  private callLifecycleMethod<T>(
    instance: T,
    method: (() => void | Promise<void>) | ((instance: T) => void | Promise<void>) | (string & keyof T) | undefined
  ): void | Promise<void> {
    if (!method) {
      return;
    }

    if (typeof method === 'function') {
      // Try calling with instance parameter first, fall back to no parameters
      try {
        return method(instance);
      } catch {
        return (method as () => void | Promise<void>)();
      }
    }

    // Method is a property name on the instance
    // biome-ignore lint/suspicious/noExplicitAny: needs any for dynamic property access
    const instanceMethod = (instance as any)[method];
    if (typeof instanceMethod === 'function') {
      return instanceMethod.call(instance);
    }
  }

  /**
   * Invalidate a blob and all its dependents
   */
  private invalidate(blobId: symbol, invalidated = new Set<symbol>()): void {
    // Prevent infinite recursion with cyclic dependencies
    if (invalidated.has(blobId)) {
      return;
    }
    invalidated.add(blobId);

    const registration = this.registrations.get(blobId);
    if (registration) {
      // Call dispose on the instance before clearing it
      if (registration.instance && registration.dispose) {
        try {
          const result = this.callLifecycleMethod(registration.instance, registration.dispose);
          // If dispose is async, we don't await it (fire-and-forget)
          // This keeps invalidate synchronous
          if (result instanceof Promise) {
            result.catch((error) => {
              console.error('Error in dispose method:', error);
            });
          }
        } catch (error) {
          console.error('Error in dispose method:', error);
        }
      }

      // Clear the cached instance
      delete registration.instance;

      // Invalidate all dependents recursively
      const deps = getDependents(blobId);
      for (const depId of deps) {
        this.invalidate(depId, invalidated);
      }

      // Clear dependency tracking for this blob
      // Note: We clear dependencies AFTER invalidating dependents
      // so that getDependents() can still find them
      clearDependencies(blobId);
    }
  }
}

/**
 * Create a new container instance.
 * Can optionally pass parent containers for nesting or merging.
 *
 * @param parents - Parent containers to inherit registrations from
 * @returns A new container instance
 *
 * @example
 * // Single parent (nesting)
 * const parent = createContainer();
 * const child = createContainer(parent);
 *
 * // Multiple parents (merging)
 * const container1 = createContainer();
 * const container2 = createContainer();
 * const merged = createContainer(container1, container2);
 *
 * // With metadata
 * const container = createContainer({
 *   name: 'Main Container',
 *   description: 'Application-wide DI container'
 * });
 */
export function createContainer(...parents: IContainer[]): IContainer;
export function createContainer(metadata: BlobMetadata, ...parents: IContainer[]): IContainer;
export function createContainer(...args: (IContainer | BlobMetadata)[]): IContainer {
  // Check if first argument is metadata (plain object without container methods)
  const firstArg = args[0];
  let metadata: BlobMetadata | undefined;
  let parents: IContainer[];

  if (isMetadata(firstArg)) {
    // First argument is metadata
    metadata = firstArg as BlobMetadata;
    parents = args.slice(1) as IContainer[];
  } else {
    // All arguments are parent containers
    metadata = undefined;
    parents = args as IContainer[];
  }

  return new Container(parents as Container[], metadata);
}
function isMetadata(value: unknown): value is BlobMetadata {
  return value != null && typeof value === 'object' && !('register' in value);
}

/**
 * Get the metadata associated with a container
 *
 * @param container - The container to get metadata for
 * @returns The metadata object, or undefined if no metadata was set
 */
export function getContainerMetadata(container: IContainer): BlobMetadata | undefined {
  return containerMetadataStore.get(container as Container);
}

// biome-ignore lint/complexity/noBannedTypes: cause we need to check if it's a function
export function isFn(obj: unknown): obj is Function {
  return obj != null && typeof obj === 'function';
}
export function isCtor(obj: unknown): obj is Ctor<unknown> {
  return isFn(obj) && obj.prototype?.constructor != null
}

export function isFactoryFn(obj: unknown): obj is FactoryFn<unknown> {
  return isFn(obj) && !isCtor(obj);
}

function isLifecycleOption(obj: unknown): obj is RegistrationOptions<unknown> {
  return obj != null && typeof obj === 'object' && 'lifecycle' in obj;
}
