/**
 * Utilities for introspecting diblob containers to extract dependency graph data
 */
import type { Container, Blob } from '@speajus/diblob';
import { getBlobId, isBlob, Lifecycle } from '@speajus/diblob';

export interface BlobNode {
  id: string;
  blobId: symbol;
  label: string;
  lifecycle: Lifecycle;
  isRegistered: boolean;
  factoryName?: string;
}

export interface BlobEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface DependencyGraph {
  nodes: BlobNode[];
  edges: BlobEdge[];
}

/**
 * Extract dependency graph from a container by analyzing registrations
 * This uses reflection on the container's internal state
 */
export function extractDependencyGraph(container: any): DependencyGraph {
  const nodes: BlobNode[] = [];
  const edges: BlobEdge[] = [];
  const seenBlobIds = new Set<symbol>();

  // Access the private registrations map via reflection
  // This is a workaround since Container doesn't expose its registrations
  const registrations = (container as any).registrations as Map<symbol, any>;

  if (!registrations) {
    return { nodes, edges };
  }

  // Process each registration
  registrations.forEach((registration, blobId) => {
    const nodeId = blobId.toString();
    
    // Extract factory name if possible
    let factoryName = 'Unknown';
    if (registration.factory) {
      factoryName = registration.factory.name || 'Anonymous';
    }

    // Create node for this blob
    nodes.push({
      id: nodeId,
      blobId,
      label: factoryName,
      lifecycle: registration.lifecycle || 'singleton',
      isRegistered: true,
      factoryName,
    });

    seenBlobIds.add(blobId);

    // Process dependencies
    if (registration.deps && Array.isArray(registration.deps)) {
      registration.deps.forEach((dep: any, index: number) => {
        if (isBlob(dep)) {
          const depBlobId = getBlobId(dep);
          const depNodeId = depBlobId.toString();

          // Create edge from this blob to its dependency
          edges.push({
            id: `${nodeId}->${depNodeId}`,
            source: nodeId,
            target: depNodeId,
            label: `dep${index}`,
          });

          // If we haven't seen this dependency blob yet, add it as a node
          if (!seenBlobIds.has(depBlobId)) {
            const isRegistered = registrations.has(depBlobId);
            nodes.push({
              id: depNodeId,
              blobId: depBlobId,
              label: isRegistered ? 'Registered' : 'Unregistered',
              lifecycle: Lifecycle.Singleton,
              isRegistered,
            });
            seenBlobIds.add(depBlobId);
          }
        }
      });
    }
  });

  return { nodes, edges };
}

/**
 * Create a readable label for a blob node
 */
export function createBlobLabel(node: BlobNode): string {
  const lifecycle = node.lifecycle === 'transient' ? '⚡' : '🔒';
  const status = node.isRegistered ? '' : ' (unregistered)';
  return `${lifecycle} ${node.label}${status}`;
}

/**
 * Get statistics about the dependency graph
 */
export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  singletons: number;
  transients: number;
  unregistered: number;
  maxDepth: number;
}

export function getGraphStats(graph: DependencyGraph): GraphStats {
  const singletons = graph.nodes.filter(n => n.lifecycle === 'singleton').length;
  const transients = graph.nodes.filter(n => n.lifecycle === 'transient').length;
  const unregistered = graph.nodes.filter(n => !n.isRegistered).length;

  // Calculate max depth (simplified - just count edges)
  const maxDepth = graph.edges.length > 0 ? Math.max(...graph.edges.map(() => 1)) : 0;

  return {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    singletons,
    transients,
    unregistered,
    maxDepth,
  };
}

