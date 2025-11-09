import { getBlobId, isBlob, Lifecycle } from '@speajus/diblob';
/**
 * Extract dependency graph from a container by analyzing registrations
 * This uses reflection on the container's internal state
 */
export function extractDependencyGraph(container) {
    const nodes = [];
    const edges = [];
    const seenBlobIds = new Set();
    // Access the private registrations map via reflection
    // This is a workaround since Container doesn't expose its registrations
    const registrations = container.registrations;
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
            registration.deps.forEach((dep, index) => {
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
export function createBlobLabel(node) {
    const lifecycle = node.lifecycle === 'transient' ? '⚡' : '🔒';
    const status = node.isRegistered ? '' : ' (unregistered)';
    return `${lifecycle} ${node.label}${status}`;
}
export function getGraphStats(graph) {
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
