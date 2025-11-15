/**
 * node:test integration helpers for diblob containers.
 */

import { after, afterEach, beforeEach } from 'node:test';
import type { Container } from '@speajus/diblob';
import { createIsolatedTestContainer, createTestContainer } from './container.js';
import type { TestContainerOptions } from './types.js';

/**
 * Setup a file-scoped test container that is disposed automatically after all tests.
 *
 * This creates a single container that is shared across all tests in the file.
 * The container is automatically disposed after all tests complete.
 *
 * @param options - Configuration options for the test container
 * @returns The shared container instance
 */
export function setupFileScopedTestContainer(options?: TestContainerOptions): Container {
  const container = createTestContainer(options);

  // Register cleanup hook to dispose the container after all tests
  after(async () => {
    await container.dispose();
  });

  return container;
}

/**
 * Setup per-test containers that are created fresh for each test.
 *
 * This creates a new isolated container for each test, ensuring complete isolation
 * between tests. Each container is automatically disposed after its test completes.
 *
 * @param options - Configuration options for test containers
 * @returns Object with getContainer() method to retrieve the current test's container
 */
export function setupEachTestContainer(options?: TestContainerOptions): {
  getContainer(): Container;
} {
  let currentContainer: Container | null = null;

  // Create a fresh container before each test
  beforeEach(() => {
    currentContainer = createIsolatedTestContainer(options);
  });

  // Dispose the container after each test
  afterEach(async () => {
    if (currentContainer) {
      await currentContainer.dispose();
      currentContainer = null;
    }
  });

  return {
    getContainer(): Container {
      if (!currentContainer) {
        throw new Error('No container available. Make sure setupEachTestContainer() is called at the top level of your test file.');
      }
      return currentContainer;
    },
  };
}
