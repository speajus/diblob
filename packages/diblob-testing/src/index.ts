/**
 * @speajus/diblob-testing
 *
 * Testing utilities and fake infrastructure blobs for diblob dependency injection containers.
 * 
 * This package provides:
 * - Test container factories with isolation options
 * - Blob override utilities for testing
 * - Fake infrastructure blobs (logger, clock, RNG, HTTP stubs)
 * - node:test integration helpers
 */


// Fake infrastructure blobs (to be implemented)
export type { 
  HttpClientStub, 
  HttpServerStub, 
  TestClock, 
  TestLogger, 
  TestRandom 
} from './blobs.js';
export { 
  httpClientStub, 
  httpServerStub, 
  testClock, 
  testLogger, 
  testRandom 
} from './blobs.js';
export { createIsolatedTestContainer, createTestContainer, withBlobOverride } from './container.js';
// node:test integration helpers (to be implemented)
export { setupEachTestContainer, setupFileScopedTestContainer } from './node-test.js';

// Registration helper (to be implemented)
export { registerTestInfrastructureBlobs } from './register.js';
// Core testing utilities (to be implemented)
export type { TestContainerOptions } from './types.js';
