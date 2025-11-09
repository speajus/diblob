/**
 * Reactive dependency tracking system
 * Tracks which blobs depend on which other blobs and invalidates when dependencies change
 */

import type { Blob } from './types';

/**
 * Stack of blobs currently being resolved
 * Used to track dependencies during resolution
 */
const resolutionStack: symbol[] = [];

/**
 * Map of blob -> Set of blobs that depend on it
 */
const dependents = new Map<symbol, Set<symbol>>();

/**
 * Map of blob -> Set of blobs it depends on
 */
const dependencies = new Map<symbol, Set<symbol>>();

/**
 * Begin tracking dependencies for a blob
 */
export function beginTracking(blobId: symbol): void {
  resolutionStack.push(blobId);
}

/**
 * End tracking dependencies for a blob
 */
export function endTracking(): void {
  resolutionStack.pop();
}

/**
 * Record that the current blob being resolved depends on another blob
 */
export function trackDependency(dependencyId: symbol): void {
  if (resolutionStack.length === 0) {
    return; // Not currently resolving anything
  }

  const currentBlobId = resolutionStack[resolutionStack.length - 1];
  
  // Don't track self-dependencies
  if (currentBlobId === dependencyId) {
    return;
  }

  // Record that currentBlob depends on dependency
  if (!dependencies.has(currentBlobId)) {
    dependencies.set(currentBlobId, new Set());
  }
  dependencies.get(currentBlobId)!.add(dependencyId);

  // Record that dependency has currentBlob as a dependent
  if (!dependents.has(dependencyId)) {
    dependents.set(dependencyId, new Set());
  }
  dependents.get(dependencyId)!.add(currentBlobId);
}

/**
 * Get all blobs that depend on the given blob
 */
export function getDependents(blobId: symbol): Set<symbol> {
  return dependents.get(blobId) || new Set();
}

/**
 * Clear all dependencies for a blob
 */
export function clearDependencies(blobId: symbol): void {
  const deps = dependencies.get(blobId);
  if (deps) {
    // Remove this blob from all its dependencies' dependent lists
    for (const depId of deps) {
      const depDependents = dependents.get(depId);
      if (depDependents) {
        depDependents.delete(blobId);
      }
    }
    dependencies.delete(blobId);
  }

  // Clear any dependents of this blob
  dependents.delete(blobId);
}

/**
 * Clear all dependency tracking
 */
export function clearAllDependencies(): void {
  dependents.clear();
  dependencies.clear();
}

