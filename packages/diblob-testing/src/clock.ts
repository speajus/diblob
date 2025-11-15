/**
 * Controllable clock implementation for testing.
 */

import type { TestClock } from './blobs.js';

/**
 * Create a controllable clock for testing time-dependent code.
 */
export function createTestClock(initialTime = 0): TestClock {
  let currentTime = initialTime;

  const clock: TestClock = {
    now(): number {
      return currentTime;
    },

    advanceBy(ms: number): void {
      if (ms < 0) {
        throw new Error('Cannot advance time by negative amount');
      }
      currentTime += ms;
    },

    moveTo(timestamp: number): void {
      if (timestamp < 0) {
        throw new Error('Cannot move to negative timestamp');
      }
      currentTime = timestamp;
    },
  };

  return clock;
}
