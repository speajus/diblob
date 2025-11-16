/**
 * Registration function for test infrastructure blobs.
 */

import type { Container } from '@speajus/diblob';
import { httpClientStub, httpServerStub, testClock, testLogger, testRandom } from './blobs.js';
import { createTestClock } from './clock.js';
import { createHttpClientStub, createHttpServerStub } from './http.js';
import { createInMemoryLogger } from './logger.js';
import { createTestRandom } from './random.js';
import type { TestContainerOptions } from './types.js';

const DEFAULT_OPTIONS: Required<TestContainerOptions> = {
  randomSeed: 42,
  initialTime: 0,
  includeHttp: true,
};

/**
 * Register test infrastructure blobs with the provided container.
 *
 * This follows the diblob pattern of a registration function that accepts a
 * container and optional configuration.
 */
export function registerTestInfrastructureBlobs(
  container: Container,
  options: TestContainerOptions = {}
): void {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };

  // Register in-memory logger
  container.register(testLogger, () => createInMemoryLogger());

  // Register controllable clock
  container.register(testClock, () => createTestClock(finalOptions.initialTime));

  // Register deterministic RNG
  container.register(testRandom, () => createTestRandom(finalOptions.randomSeed));

  // Register HTTP stubs if requested
  if (finalOptions.includeHttp) {
    container.register(httpClientStub, () => createHttpClientStub());
    container.register(httpServerStub, () => createHttpServerStub());
  }
}
