/**
 * Test container factories and blob override utilities.
 */

	import { type Blob, type Container, createContainer, type Factory, isBlob, Lifecycle } from '@speajus/diblob';
import { registerTestInfrastructureBlobs } from './register.js';
import type { TestContainerOptions } from './types.js';

/**
 * Create a test container with fake infrastructure blobs pre-registered.
 *
 * This creates a standard container and registers test infrastructure blobs
 * like in-memory logger, controllable clock, deterministic RNG, and HTTP stubs.
 */
export function createTestContainer(options?: TestContainerOptions): Container {
  const container = createContainer();
  registerTestInfrastructureBlobs(container, options);
  return container;
}

/**
 * Create an isolated test container where all registrations default to transient lifecycle.
 *
 * This creates a test container and monkey-patches its register method so that
 * all registrations default to Lifecycle.Transient unless explicitly overridden.
 * This ensures no singletons are shared between tests.
 */
export function createIsolatedTestContainer(options?: TestContainerOptions): Container {
  const container = createTestContainer(options);

	  // Store the original register method
	  const originalRegister = container.register.bind(container);

	  // Override the register method to default to transient lifecycle
	  container.register = <T>(
	    blob: Blob<T>,
	    factory: unknown,
	    ...deps: unknown[]
	  ): void => {
	    const lastDep = deps[deps.length - 1];
	    let hasOptions = false;

	    if (lastDep !== undefined && lastDep !== null && typeof lastDep === 'object') {
	      // Never treat blobs (including list blobs) as registration options.
	      if (!isBlob(lastDep as unknown)) {
	        // Treat only "plain" objects as options. This avoids probing
	        // properties (which would trigger proxy traps like `has`/`get`
	        // on special blobs such as list blobs).
	        const proto = Object.getPrototypeOf(lastDep);
	        if (proto === Object.prototype || proto === null) {
	          hasOptions = true;
	        }
	      }
	    }

	    if (!hasOptions) {
	      // No options provided, add transient lifecycle
	      deps.push({ lifecycle: Lifecycle.Transient });
	    }
	    // If options are provided with an explicit lifecycle, don't override it

	    originalRegister(blob, factory as Factory<T>, ...deps);
	  };

  return container;
}

/**
 * Execute a test function with a blob override in a child container.
 *
 * Creates a child container from the base container, registers the blob override,
 * executes the test function, and ensures proper cleanup.
 */
export async function withBlobOverride<T, R>(
  baseContainer: Container,
  blob: Blob<T>,
  implementationOrFactory: T | (() => T | Promise<T>),
  testFn: (container: Container) => R | Promise<R>
): Promise<R> {
  // Create a child container to isolate the override
  const childContainer = createContainer(baseContainer);

  try {
    // Register the override in the child container
    if (typeof implementationOrFactory === 'function') {
      // It's a factory function
      childContainer.register(blob, implementationOrFactory as () => T);
    } else {
      // It's a direct implementation, wrap it in a factory
      childContainer.register(blob, () => implementationOrFactory);
    }

    // Execute the test function with the child container
    return await testFn(childContainer);
  } finally {
    // Clean up the child container
    await childContainer.dispose();
  }
}
