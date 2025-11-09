/**
 * Blob creation and proxy implementation
 */

import type { Blob } from './types';
import { blobPropSymbol } from './types';
/**
 * WeakMap to store blob metadata
 * Maps from the blob proxy to its internal ID
 */
const blobMetadata = new WeakMap<object, symbol>();

/**
 * Global registry of blob handlers
 * Maps blob ID to a handler function that resolves the blob
 */
export const blobHandlers = new Map<symbol, (prop: string | symbol) => any>();

/**
 * Global registry of instance getters
 * Maps blob ID to a function that returns the resolved instance
 */
export const blobInstanceGetters = new Map<symbol, () => any>();

/**
 * Create a new blob that acts as both a key and a proxy for type T
 * 
 * @returns A proxy object that can be registered with a container
 * 
 * @example
 * ```typescript
 * interface UserService {
 *   getUser(id: number): User;
 * }
 * 
 * const userService = createBlob<UserService>();
 * container.register(userService, () => new UserServiceImpl());
 * 
 * // userService now acts as UserService
 * const user = userService.getUser(123);
 * ```
 */
export function createBlob<T extends object>(name = 'blob'): Blob<T> {
  const blobId = Symbol(name);

  // Create a proxy that will be populated by the container
  const proxy = new Proxy({} as Blob<T>, {
    get(_target, prop) {
      // Special property to identify this as a blob and get its ID
      if (prop === blobPropSymbol) {
        return blobId;
      }

      // If we're tracking constructor dependencies, record this blob access
      if (isTrackingConstructor()) {
        trackConstructorDependency(proxy);
      }

      // Check if a handler is registered for this blob
      const handler = blobHandlers.get(blobId);
      if (!handler) {
        throw new Error(
          `Blob not yet resolved. Make sure to register this blob with a container before using it.`
        );
      }

      // Delegate to the handler
      return handler(prop);
    },

    set(_target, prop, value) {
      // Check if an instance getter is registered for this blob
      const instanceGetter = blobInstanceGetters.get(blobId);
      if (!instanceGetter) {
        throw new Error(
          `Blob not yet resolved. Make sure to register this blob with a container before using it.`
        );
      }

      // Get the resolved instance
      const instance = instanceGetter();

      // Handle async instance
      if (instance instanceof Promise) {
        throw new Error('Cannot set property on async blob. Await the blob first.');
      }

      // Set the property on the actual instance
      (instance as any)[prop] = value;
      return true;
    },
  });

  // Store the blob ID in metadata
  blobMetadata.set(proxy, blobId);

  return proxy as Blob<T>;
}

/**
 * Get the internal ID of a blob
 */
export function getBlobId<T>(blob: Blob<T>): symbol {
  const id = blobMetadata.get(blob as object);
  if (!id) {
    throw new Error('Invalid blob: not created with createBlob()');
  }
  return id;
}

/**
 * Check if an object is a blob
 */
export function isBlob(obj: unknown): obj is Blob<any> {
  return obj != null && blobMetadata.has(obj);
}

/**
 * Singleton array for tracking blob accesses during constructor execution
 */
let constructorDependencies: Blob<unknown>[] | null = null;

/**
 * Begin tracking blob accesses for constructor parameter detection
 */
export function beginConstructorTracking(): void {
  constructorDependencies = [];
}

/**
 * End tracking and return the blobs that were accessed
 */
export function endConstructorTracking(): Blob<any>[] {
  const deps = constructorDependencies || [];
  constructorDependencies = null;
  return deps;
}

/**
 * Check if we're currently tracking constructor dependencies
 */
export function isTrackingConstructor(): boolean {
  return constructorDependencies !== null;
}

/**
 * Track a blob access during constructor execution
 */
export function trackConstructorDependency<T>(blob: Blob<T>): void {
  if (constructorDependencies !== null) {
    constructorDependencies.push(blob);
  }
}

