import { Lifecycle } from '@speajus/diblob';
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
export declare function extractDependencyGraph(container: any): DependencyGraph;
/**
 * Create a readable label for a blob node
 */
export declare function createBlobLabel(node: BlobNode): string;
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
export declare function getGraphStats(graph: DependencyGraph): GraphStats;
