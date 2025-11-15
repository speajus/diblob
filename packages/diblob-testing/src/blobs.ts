/**
 * Blob and interface definitions for fake infrastructure services.
 */

import { createBlob } from '@speajus/diblob';

/**
 * In-memory logger interface for testing.
 */
export interface TestLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  
  /** Retrieve all logged records for assertions */
  getRecords(): LogRecord[];
  
  /** Clear all logged records */
  clear(): void;
}

/**
 * A single log record.
 */
export interface LogRecord {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  meta?: Record<string, unknown>;
  timestamp: number;
}

/**
 * Controllable clock interface for testing.
 */
export interface TestClock {
  /** Get current time in milliseconds */
  now(): number;
  
  /** Advance time by the specified milliseconds */
  advanceBy(ms: number): void;
  
  /** Move time to a specific timestamp */
  moveTo(timestamp: number): void;
}

/**
 * Deterministic random number generator for testing.
 */
export interface TestRandom {
  /** Generate a random number between 0 and 1 */
  random(): number;
  
  /** Generate a random integer between min (inclusive) and max (exclusive) */
  randomInt(min: number, max: number): number;
  
  /** Reset the RNG to its initial seed */
  reset(): void;
}

/**
 * HTTP client stub for testing.
 */
export interface HttpClientStub {
  /** Fetch implementation that uses queued responses */
  fetch(url: string | URL, init?: RequestInit): Promise<Response>;
  
  /** Queue a response for the next fetch call */
  queueResponse(response: Response | (() => Response)): void;
  
  /** Get all requests that were made */
  getSentRequests(): Array<{ url: string | URL; init?: RequestInit }>;
  
  /** Clear sent requests history */
  clearRequests(): void;
}

/**
 * HTTP server stub for testing.
 */
export interface HttpServerStub {
  /** Handle a request using the configured handler */
  handle(request: Request): Promise<Response>;
  
  /** Configure the request handler */
  configure(handler: (request: Request) => Response | Promise<Response>): void;
  
  /** Get all requests that were handled */
  getHandledRequests(): Request[];
  
  /** Clear handled requests history */
  clearRequests(): void;
}

// Blob declarations
export const testLogger = createBlob<TestLogger>('testLogger', {
  name: 'Test Logger',
  description: 'In-memory logger for testing',
});

export const testClock = createBlob<TestClock>('testClock', {
  name: 'Test Clock',
  description: 'Controllable clock for testing',
});

export const testRandom = createBlob<TestRandom>('testRandom', {
  name: 'Test Random',
  description: 'Deterministic RNG for testing',
});

export const httpClientStub = createBlob<HttpClientStub>('httpClientStub', {
  name: 'HTTP Client Stub',
  description: 'HTTP client stub for testing',
});

export const httpServerStub = createBlob<HttpServerStub>('httpServerStub', {
  name: 'HTTP Server Stub',
  description: 'HTTP server stub for testing',
});
