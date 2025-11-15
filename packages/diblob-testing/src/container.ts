/**
 * Test container factories and blob override utilities.
 */

import type { Container } from '@speajus/diblob';
import type { TestContainerOptions } from './types.js';

/**
 * Create a test container with fake infrastructure blobs pre-registered.
 */
export function createTestContainer(options?: TestContainerOptions): Container {
  // TODO: Implement in next PR
  throw new Error('Not implemented yet');
}

/**
 * Create an isolated test container where all registrations default to transient lifecycle.
 */
export function createIsolatedTestContainer(options?: TestContainerOptions): Container {
  // TODO: Implement in next PR
  throw new Error('Not implemented yet');
}

/**
 * Execute a test function with a blob override in a child container.
 */
export async function withBlobOverride<T, R>(
  baseContainer: Container,
  blob: any, // TODO: Type as Blob<T>
  implementationOrFactory: T | (() => T),
  testFn: (container: Container) => R | Promise<R>
): Promise<R> {
  // TODO: Implement in next PR
  throw new Error('Not implemented yet');
}
