/**
 * DI Container implementation
 */

import type { Blob, Factory, FactoryParams, Container as IContainer, RegisterParams, BlobMetadata } from './types';
import { blobPropSymbol, Lifecycle } from './types';
import { getBlobId, blobHandlers, blobInstanceGetters, isBlob, beginConstructorTracking, endConstructorTracking, setBlobContainer } from './blob';
import {
  beginTracking,
  endTracking,
  trackDependency,
  getDependents,
  clearDependencies,
  clearAllDependencies,
} from './reactive';

interface Registration<T = any> {
  factory: Factory<T>;
  deps: any[];
  lifecycle: Lifecycle;
  instance?: T;
  resolving?: boolean; // Track if currently being resolved (for cyclic dependency detection)
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

  register<T extends object, TFactory extends Factory<T>>(blob: Blob<T>, factory: Factory<T>, ...deps: RegisterParams<TFactory>): void {
    const blobId = getBlobId(blob);

    // Track which container registered this blob (first registration wins)
    setBlobContainer(blobId, this);

    // Extract lifecycle option if the last dep is a RegistrationOptions object
    let lifecycle = Lifecycle.Singleton;
    let actualDeps = deps as unknown as FactoryParams<TFactory>;

    if (deps.length > 0) {
      const lastDep = deps[deps.length - 1];
      if (lastDep && typeof lastDep === 'object' && 'lifecycle' in lastDep && !isBlob(lastDep)) {
        lifecycle = (lastDep as { lifecycle?: Lifecycle }).lifecycle ?? Lifecycle.Singleton;
        actualDeps = deps.slice(0, -1) as FactoryParams<TFactory>;
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
      const instance = this.resolve(blob);

      // Handle async resolution
      if (instance instanceof Promise) {
        return instance.then((resolved) => {
          const value = (resolved as any)[prop];
          if (typeof value === 'function') {
            return value.bind(resolved);
          }
          return value;
        });
      }

      // Forward the property access to the instance
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
    });
  }

  resolve<T extends object>(blobOrConstructor: Blob<T> | (new (...args: any[]) => T)): T | Promise<T> {
    // Check if it's a blob or a constructor
    if (isBlob(blobOrConstructor)) {
      return this.resolveBlob(blobOrConstructor as Blob<T>);
    } else {
      return this.resolveConstructor(blobOrConstructor as new (...args: any[]) => T);
    }
  }

  private resolveBlob<T extends object>(blob: Blob<T>): T | Promise<T> {
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

    // For singleton lifecycle, return cached instance if available
    if (registration.lifecycle === Lifecycle.Singleton && registration.instance) {
      return registration.instance as T;
    }

    // Detect cyclic dependency - if already resolving, return the blob itself
    // The blob proxy will forward to the instance once it's created
    if (registration.resolving) {
      return blob as unknown as T;
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
          return this.resolveBlob(dep);
        } else {
          // It's a plain value - use it directly
          return dep;
        }
      });

      // Check if any dependencies are promises
      const hasAsyncDeps = resolvedDeps.some((dep) => dep instanceof Promise);

      if (hasAsyncDeps) {
        // Async resolution
        return Promise.all(resolvedDeps).then((deps) => {
          const instance = this.instantiate(registration.factory, deps);

          // Handle async factory
          if (instance instanceof Promise) {
            return instance.then((resolved) => {
              if (registration.lifecycle === Lifecycle.Singleton) {
                registration.instance = resolved;
              }
              registration.resolving = false;
              return resolved;
            });
          }

          if (registration.lifecycle === Lifecycle.Singleton) {
            registration.instance = instance;
          }
          registration.resolving = false;
          return instance;
        }) as Promise<T>;
      }

      // Sync resolution
      const instance = this.instantiate(registration.factory, resolvedDeps);

      // Handle async factory in sync context
      if (instance instanceof Promise) {
        return instance.then((resolved) => {
          if (registration.lifecycle === Lifecycle.Singleton) {
            registration.instance = resolved;
          }
          registration.resolving = false;
          return resolved;
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

  private resolveConstructor<T extends object>(ctor: new (...args: any[]) => T): T | Promise<T> {
    // Begin tracking blob accesses during constructor execution
    beginConstructorTracking();

    let instance: T;
    try {
      // Instantiate the constructor - any blob default parameters will be tracked
      instance = new ctor();
    } catch (error) {
      // Make sure to end tracking even if there's an error
      endConstructorTracking();
      throw error;
    }

    // Get the blobs that were accessed during construction
    const blobDeps = endConstructorTracking();

    // If any blobs were accessed, we need to check if they're async
    if (blobDeps.length > 0) {
      // Resolve all blob dependencies to check for async
      const resolvedDeps = blobDeps.map(blob => this.resolveBlob(blob));
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
    return instance;
  }

  private instantiate<T>(factory: Factory<T>, deps: any[]): T | Promise<T> {
    // Check if it's a constructor (has prototype)
    if (factory.prototype && factory.prototype.constructor) {
      // It's a constructor - use 'new'
      return new (factory as new (...args: any[]) => T)(...deps);
    } else {
      // It's a factory function - call it directly
      return (factory as (...args: any[]) => T | Promise<T>)(...deps);
    }
  }

  has<T extends object>(blob: Blob<T>): boolean {
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

  unregister<T extends object>(blob: Blob<T>): void {
    const blobId = getBlobId(blob);
    this.invalidate(blobId);
    this.registrations.delete(blobId);
    blobHandlers.delete(blobId);
  }

  clear(): void {
    this.registrations.clear();
    blobHandlers.clear();
    clearAllDependencies();
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

  if (firstArg && typeof firstArg === 'object' && !('register' in firstArg)) {
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

/**
 * Get the metadata associated with a container
 *
 * @param container - The container to get metadata for
 * @returns The metadata object, or undefined if no metadata was set
 */
export function getContainerMetadata(container: IContainer): BlobMetadata | undefined {
  return containerMetadataStore.get(container as Container);
}

