/**
 * Blob creation and proxy implementation
 */

import type { Container } from './container';
import type { Blob, BlobMetadata } from './types';
import { blobPropSymbol } from './types';

/**
 * WeakMap to store blob IDs
 * Maps from the blob proxy to its internal ID
 */
const blobIds = new WeakMap<Blob<unknown>, symbol>();

/**
 * WeakMap to store blob metadata
 * Maps from the blob proxy to its metadata object
 */
const blobMetadataStore = new WeakMap<Blob<unknown>, BlobMetadata>();

/**
 * Global registry of blob handlers
 * Maps blob ID to a handler function that resolves the blob
 */
export const blobHandlers = new Map<symbol, (prop: string | symbol) => unknown>();

/**
 * Global registry of instance getters
 * Maps blob ID to a function that returns the resolved instance
 */
export const blobInstanceGetters = new Map<symbol, () => unknown>();

/**
 * Global registry of blob containers
 * Maps blob ID to the container that first registered it
 * Used by ListBlob and other special blobs to detect their container
 */
export const blobContainers = new Map<symbol, Container>();

/**
 * Register a blob ID for a proxy object
 * Used by createListBlob and other special blob creators
 */
export function registerBlobId(proxy: Blob<unknown>, id: symbol): void {
  blobIds.set(proxy, id);
}

/**
 * Create a new blob that acts as both a key and a proxy for type T
 *
 * @param name - Optional name for the blob (used in Symbol creation)
 * @param metadata - Optional metadata for debugging and visualization
 * @returns A proxy object that can be registered with a container
 *
 * @example
 * ```typescript
 * interface UserService {
 *   getUser(id: number): User;
 * }
 *
 * const userService = createBlob<UserService>('userService', {
 *   name: 'User Service',
 *   description: 'Handles user-related operations'
 * });
 * container.register(userService, () => new UserServiceImpl());
 *
 * // userService now acts as UserService
 * const user = userService.getUser(123);
 * ```
 */
export function createBlob<T extends object>(name = 'blob', metadata?: BlobMetadata): Blob<T> {
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
      // biome-ignore lint/suspicious/noExplicitAny: we know what it is.
            (instance as any)[prop] = value;
      return true;
    },
  });

  // Store the blob ID
  blobIds.set(proxy, blobId);

  // Store metadata if provided
  if (metadata) {
    blobMetadataStore.set(proxy, metadata);
  }

  return proxy as Blob<T>;
}

/**
 * Get the internal ID of a blob
 */
export function getBlobId<T>(blob: Blob<T>): symbol {
  const id = blobIds.get(blob);
  if (!id) {
    throw new Error('Invalid blob: not created with createBlob()');
  }
  return id;
}

/**
 * Check if an object is a blob
 */
export function isBlob(obj: unknown): obj is Blob<unknown> {
  return obj != null && blobIds.has(obj as Blob<unknown>);
}

/**
 * Get the metadata associated with a blob
 *
 * @param blob - The blob to get metadata for
 * @returns The metadata object, or undefined if no metadata was set
 */
export function getBlobMetadata<T>(blob: Blob<T>): BlobMetadata | undefined {
  return blobMetadataStore.get(blob);
}

/**
 * Set the container that registered a blob
 * Only sets if not already set (first registration wins)
 *
 * @param blobId - The blob ID
 * @param container - The container that registered the blob
 */
export function setBlobContainer(blobId: symbol, container: Container): void {
  if (!blobContainers.has(blobId)) {
    blobContainers.set(blobId, container);
  }
}

/**
 * Get the container that registered a blob
 *
 * @param blobId - The blob ID
 * @returns The container, or undefined if not registered
 */
export function getBlobContainer(blobId: symbol): Container | undefined {
  return blobContainers.get(blobId);
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
export function endConstructorTracking(): Blob<unknown>[] {
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

