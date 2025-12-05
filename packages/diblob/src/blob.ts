/**
 * Blob creation and proxy implementation
 */

import type { Blob, BlobMetadata } from './types.js';
import {
	blobContainerSymbol,
	blobMetadatStoreSymbol,
	blobPropSymbol,
	containerResolveBlobInstanceSymbol,
	containerResolveBlobPropSymbol,
	listBlobMarkerSymbol,
} from './types.js';

/**
 * Error thrown when a blob is accessed during constructor execution
 * but the blob is not yet resolved (async dependency)
 */
export class BlobNotReadyError extends Error {
  constructor(public readonly promise: Promise<unknown>) {
    super('Blob not yet resolved - async dependency detected');
    Object.setPrototypeOf(this, BlobNotReadyError.prototype);
  }
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
let blobIndex = 0;
export function createBlob<T extends object>(name = `blob-${blobIndex++}`, metadata?: BlobMetadata): Blob<T> {
	  const blobId = Symbol(name);

		  // Target object used only for storing internal state (like the container).
		  const target = {} as Blob<T>;
		  
		  // Create a proxy that will be populated by the container
		  const proxy = new Proxy(target, {
		    get(_target, prop) {
	      // Special property to identify this as a blob and get its ID
	      if (prop === blobPropSymbol) {
	        return blobId;
	      }

			  if (prop === blobMetadatStoreSymbol) {
					return metadata;
		 	}

				// Regular blobs are not list blobs, but they must safely report that
				// they are *not* marked as such without touching the container. This is
				// important because container.register() probes blobs with the
				// listBlobMarkerSymbol before the container reference has been
				// attached. If we tried to resolve via the container here we would
				// throw, breaking basic registration flows.
				if (prop === listBlobMarkerSymbol) {
					return undefined;
				}

		      // Allow reading the attached container (used by special blobs)
		      if (prop === blobContainerSymbol) {
		        return target[blobContainerSymbol];
		      }

	      // If we're tracking constructor dependencies, record this blob access
	      if (isTrackingConstructor()) {
	        trackConstructorDependency(proxy);
	      }

	      // Resolve via the owning container
	      // biome-ignore lint/suspicious/noExplicitAny: internal wiring only.
	      const container = (target as any)[blobContainerSymbol];
	      if (!container) {
	        throw new Error(
	          'Blob not yet resolved. Make sure to register this blob with a container before using it.',
	        );
	      }

		      // Containers that support blobs expose a resolver method keyed by
		      // containerResolveBlobPropSymbol.
		      const resolveProperty = container[containerResolveBlobPropSymbol] as
		        | ((blob: Blob<unknown>, property: string | symbol) => unknown)
		        | undefined;
		      if (!resolveProperty) {
		        throw new Error('Container does not support blob property resolution.');
		      }
		
		      // Make sure the container instance is used as `this` so internal
		      // resolution logic (which calls this.resolve) works correctly.
		      const result = resolveProperty.call(container, proxy, prop);

	      // If we're tracking constructor dependencies and the result is a Promise,
	      // throw a special error that includes the promise
	      if (isTrackingConstructor() && result instanceof Promise) {
	        throw new BlobNotReadyError(result);
	      }

	      return result;
	    },

	    set(_target, prop, value) {
	      // Allow the container to attach itself once (first registration wins)
	      if (prop === blobContainerSymbol) {
	        // biome-ignore lint/suspicious/noExplicitAny: internal wiring only.
	        if ((target as any)[blobContainerSymbol] === undefined) {
	          // biome-ignore lint/suspicious/noExplicitAny: internal wiring only.
	          (target as any)[blobContainerSymbol] = value;
	        }
	        return true;
	      }

	      // biome-ignore lint/suspicious/noExplicitAny: internal wiring only.
	      const container = (target as any)[blobContainerSymbol];
	      if (!container) {
	        throw new Error(
	          'Blob not yet resolved. Make sure to register this blob with a container before using it.',
	        );
	      }

		      // Containers that support blobs expose an instance resolver method keyed
		      // by containerResolveBlobInstanceSymbol.
		      const resolveInstance = container[containerResolveBlobInstanceSymbol] as
		        | ((blob: Blob<unknown>) => unknown)
		        | undefined;
		      if (!resolveInstance) {
		        throw new Error('Container does not support blob instance resolution.');
		      }

		      // Use the container instance as `this` so the resolver can call
		      // this.resolve correctly.
		      const instance = resolveInstance.call(container, proxy);

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

  return proxy as Blob<T>;
}

/**
 * Get the internal ID of a blob
 */
export function getBlobId<T>(blob: Blob<T>): symbol {
  const id = blob[blobPropSymbol];
  if (!id) {
    throw new Error('Invalid blob: not created with createBlob()');
  }
  return id;
}

/**
 * Check if an object is a blob.
 *
 * We detect blobs by reading the special symbol property rather than using
 * the `in` operator. This is important because some special blobs (like
 * list blobs) implement a `has` trap that would otherwise try to resolve
 * their value from the container when probed with `in`, which can throw if
 * they haven't been registered yet.
 */
export function isBlob(obj: unknown): obj is Blob<unknown> {
	  if (obj == null || typeof obj !== 'object') {
	    return false;
	  }
	  // Safe for proxies: both regular blobs and list blobs handle this symbol
	  // specially in their `get` trap without touching the container.
	  const id = (obj as Blob<unknown>)[blobPropSymbol];
	  return typeof id === 'symbol';
}

/**
 * Get the metadata associated with a blob
 *
 * @param blob - The blob to get metadata for
	 * @returns The metadata object, or undefined if no metadata was set
 */
export function getBlobMetadata<T>(blob: Blob<T>): BlobMetadata | undefined {
		return blob?.[blobMetadatStoreSymbol];
}



/**
 * Set the container that registered a blob
 * Only sets if not already set (first registration wins)
 *
 * @param blobId - The blob ID
 * @param container - The container that registered the blob
 */
// setBlobContainer/getBlobContainer have been removed in favor of attaching
// the container instance directly to the blob via blobContainerSymbol. This
// keeps handler mappings scoped to the container instead of global maps.

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

