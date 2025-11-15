/**
 * node:test integration helpers for diblob containers.
 */

import type { Container } from '@speajus/diblob';
import type { TestContainerOptions } from './types.js';

/**
 * Setup a file-scoped test container that is disposed automatically after all tests.
 */
export function setupFileScopedTestContainer(options?: TestContainerOptions): Container {
  // TODO: Implement in next PR
  throw new Error('Not implemented yet');
}

/**
 * Setup per-test containers that are created fresh for each test.
 */
export function setupEachTestContainer(options?: TestContainerOptions): {
  getContainer(): Container;
} {
  // TODO: Implement in next PR
  throw new Error('Not implemented yet');
}
