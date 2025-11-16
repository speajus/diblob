/**
 * Type definitions for diblob-testing utilities.
 */

/**
 * Configuration options for test containers.
 */
export interface TestContainerOptions {
  /** Random seed for deterministic RNG. Defaults to 42. */
  randomSeed?: number;
  
  /** Initial time for test clock in milliseconds since epoch. Defaults to 0. */
  initialTime?: number;
  
  /** Whether to include HTTP client/server stubs. Defaults to true. */
  includeHttp?: boolean;
}
