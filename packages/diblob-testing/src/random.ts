/**
 * Deterministic random number generator implementation for testing.
 */

import type { TestRandom } from './blobs.js';

/**
 * Create a deterministic random number generator using a simple LCG algorithm.
 * This ensures reproducible test results when given the same seed.
 */
export function createTestRandom(seed = 42): TestRandom {
  let currentSeed = seed;
  const originalSeed = seed;

  // Linear Congruential Generator parameters (same as used by glibc)
  const a = 1103515245;
  const c = 12345;
  const m = 2 ** 31;

  const random: TestRandom = {
    random(): number {
      // Update the seed using LCG formula
      currentSeed = (a * currentSeed + c) % m;
      // Return a value between 0 and 1
      return currentSeed / m;
    },

    randomInt(min: number, max: number): number {
      if (min >= max) {
        throw new Error('min must be less than max');
      }
      if (!Number.isInteger(min) || !Number.isInteger(max)) {
        throw new Error('min and max must be integers');
      }
      
      const range = max - min;
      return Math.floor(random.random() * range) + min;
    },

    reset(): void {
      currentSeed = originalSeed;
    },
  };

  return random;
}
