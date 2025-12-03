/**
 * Array blob implementation for managing arrays with automatic invalidation
 */

	import {
	  BlobNotReadyError,
	} from './blob.js';
	import {
	  type Blob,
	  type BlobMetadata,
	  blobContainerSymbol,
	  blobMetadatStoreSymbol,
	  blobPropSymbol,
	  type Container,
	  containerResolveBlobInstanceSymbol,
	  listBlobMarkerSymbol,
	} from './types.js';

/**
 * Create a new array blob that manages an array with automatic invalidation
 *
 * When array mutation methods are called (push, pop, shift, unshift, splice, etc.),
 * the blob automatically invalidates itself and all dependent blobs receive a newly
 * re-initialized array instance (not a mutated reference to the old array).
 *
 * The blob must be registered with a container before use. After registration,
 * mutations automatically detect the container and trigger invalidation.
 *
 * @param name - Optional name for the blob (used in Symbol creation)
 * @param metadata - Optional metadata for debugging and visualization
 * @returns A Blob<Array<T>> that proxies array methods with automatic invalidation
 *
 * @example
 * ```typescript
 * const list = createListBlob<string>('myList');
 *
 * // Register with a container (required before use)
 * container.register(list, () => []);
 *
 * // Use the blob in other registrations
 * container.register(myService, MyServiceImpl, list);
 *
 * // Mutate the list - this triggers invalidation
 * list.push('item1', 'item2');
 * list.pop();
 *
 * // Access the array directly through the blob
 * console.log(list[0]); // 'item2'
 * console.log(list.length); // 1
 * ```
 */
	let listBlobIndex = 0;
	export function createListBlob<T>(
	  name = `listBlob-${listBlobIndex++}`,
	  metadata?: BlobMetadata,
	): Blob<Array<T>> {
		  const blobId = Symbol(name);

		  // Target object used for storing internal state such as the container
		  // reference. The container will attach itself by setting
		  // target[blobContainerSymbol] via the proxy.
			  const target: { [blobContainerSymbol]?: Container; [listBlobMarkerSymbol]?: true } = {};
				// Mark this proxy as a list blob so the container can recognize and
				// safely re-bind it to different containers when reused.
				target[listBlobMarkerSymbol] = true;

	  // Forward declaration for use in closures
	  let proxyBlob: Blob<Array<T>>;

  /**
   * Get the current array from the container
   */
	  const getCurrentArray = (): Array<T> => {
		    const container = target[blobContainerSymbol];
	    if (!container) {
	      throw new Error(
	        'Array blob must be registered with a container before use. Call container.register(list, () => []) first.',
	      );
	    }

		    // Containers that support blobs expose an instance resolver via symbol.
		    // biome-ignore lint/suspicious/noExplicitAny: internal wiring only.
		    const resolveInstance = (container as any)[containerResolveBlobInstanceSymbol] as
	      | ((blob: Blob<unknown>) => unknown)
	      | undefined;
	    if (!resolveInstance) {
	      throw new Error('Container does not support blob instance resolution.');
	    }

		    const current = resolveInstance.call(container, proxyBlob as unknown as Blob<unknown>);
    if (current instanceof Promise) {
      throw new BlobNotReadyError(current);
    }
    return current as Array<T>;
  };

  /**
   * Update the array and trigger invalidation
   */
	  const updateArray = (newArray: Array<T>): void => {
		    const container = target[blobContainerSymbol];
    if (!container) {
      throw new Error('Array blob must be registered with a container before mutations. Call container.register(list, () => []) first.');
    }
    container.register(proxyBlob, () => newArray);
  };

  // Array mutation methods that trigger invalidation
  const mutationMethods = {
    push(...items: T[]): number {
      const current = getCurrentArray();
      const newArray = [...current, ...items];
      updateArray(newArray);
      return newArray.length;
    },

    pop(): T | undefined {
      const current = getCurrentArray();
      if (current.length === 0) {
        return undefined;
      }
      const newArray = [...current];
      const item = newArray.pop();
      updateArray(newArray);
      return item;
    },

    shift(): T | undefined {
      const current = getCurrentArray();
      if (current.length === 0) {
        return undefined;
      }
      const newArray = [...current];
      const item = newArray.shift();
      updateArray(newArray);
      return item;
    },

    unshift(...items: T[]): number {
      const current = getCurrentArray();
      const newArray = [...items, ...current];
      updateArray(newArray);
      return newArray.length;
    },

    splice(start: number, deleteCount?: number, ...items: T[]): Array<T> {
      const current = getCurrentArray();
      const newArray = [...current];
      const removed = deleteCount === undefined
        ? newArray.splice(start)
        : newArray.splice(start, deleteCount, ...items);
      updateArray(newArray);
      return removed;
    },

    reverse(): Array<T> {
      const current = getCurrentArray();
      const newArray = [...current].reverse();
      updateArray(newArray);
      return newArray;
    },

    sort(compareFn?: (a: T, b: T) => number): Array<T> {
      const current = getCurrentArray();
      const newArray = [...current].sort(compareFn);
      updateArray(newArray);
      return newArray;
    },

    fill(value: T, start?: number, end?: number): Array<T> {
      const current = getCurrentArray();
      const newArray = [...current];
      newArray.fill(value, start, end);
      updateArray(newArray);
      return newArray;
    },

    copyWithin(target: number, start: number, end?: number): Array<T> {
      const current = getCurrentArray();
      const newArray = [...current];
      newArray.copyWithin(target, start, end);
      updateArray(newArray);
      return newArray;
    },
  };

			  const handler: ProxyHandler<object> = {
			    get(_target, prop) {
	      // Return the blob ID symbol
	      if (prop === blobPropSymbol) {
	        return blobId;
	      }

		      // Allow metadata introspection without resolving the array
		      if (prop === blobMetadatStoreSymbol) {
		        return metadata;
		      }

			      // Allow containers and internals to read the attached container
			      if (prop === blobContainerSymbol) {
			        return target[blobContainerSymbol];
			      }

			      // Internal marker so the container can detect list blobs without
			      // forcing array resolution.
			      if (prop === listBlobMarkerSymbol) {
			        return true;
			      }

      // Intercept mutation methods
      if (prop in mutationMethods) {
        return mutationMethods[prop as keyof typeof mutationMethods];
      }

      // For all other properties, get from the current array
      const current = getCurrentArray();
      const value = current[prop as keyof Array<T>];

      // Bind functions to the current array
      if (typeof value === 'function') {
        return value.bind(current);
      }

      return value;
    },

    has(_target, prop) {
      if (prop === blobPropSymbol) {
        return true;
      }
      const current = getCurrentArray();
      return prop in current;
    },

    ownKeys(_target) {
      const current = getCurrentArray();
      return Reflect.ownKeys(current);
    },

		    getOwnPropertyDescriptor(_target, prop) {
		      if (prop === blobPropSymbol) {
        return {
          value: blobId,
          writable: false,
          enumerable: false,
          configurable: false,
        };
		      }
		
			      // For internal container wiring, allow the engine to inspect the
			      // container attachment and list marker without forcing array
			      // resolution.
			      if (prop === blobContainerSymbol || prop === listBlobMarkerSymbol) {
			        return Reflect.getOwnPropertyDescriptor(target, prop);
			      }
      const current = getCurrentArray();
      return Reflect.getOwnPropertyDescriptor(current, prop);
    },
  };

	  proxyBlob = new Proxy(target as object, handler) as Blob<Array<T>>;


  return proxyBlob;
}

