<script lang="ts">
  import { SvelteFlow, Controls, Background, MiniMap } from '@xyflow/svelte';
  import type { Node, Edge } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import type { DependencyGraph } from './container-introspection';
  import { createBlobLabel } from './container-introspection';

  const { graph }: { graph: DependencyGraph } = $props();

  // Convert our graph format to Svelte Flow format
  function convertToFlowGraph(depGraph: DependencyGraph): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = depGraph.nodes.map((node, index) => ({
      id: node.id,
      type: 'default',
      data: {
        label: createBlobLabel(node),
        lifecycle: node.lifecycle,
        isRegistered: node.isRegistered,
      },
      position: {
        x: (index % 4) * 250,
        y: Math.floor(index / 4) * 150
      },
      style: getNodeStyle(node.lifecycle, node.isRegistered),
    }));

    const edges: Edge[] = depGraph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: true,
      style: 'stroke: #888; stroke-width: 2px;',
    }));

    return { nodes, edges };
  }

  function getNodeStyle(lifecycle: string, isRegistered: boolean): string {
    let bgColor = '#fff';
    let borderColor = '#888';
    let borderWidth = '2px';

    if (!isRegistered) {
      bgColor = '#ffebee';
      borderColor = '#f44336';
      borderWidth = '2px';
    } else if (lifecycle === 'singleton') {
      bgColor = '#e3f2fd';
      borderColor = '#2196f3';
      borderWidth = '3px';
    } else if (lifecycle === 'transient') {
      bgColor = '#fff3e0';
      borderColor = '#ff9800';
      borderWidth = '2px';
    }

    return `background: ${bgColor}; border: ${borderWidth} solid ${borderColor}; border-radius: 8px; padding: 10px; font-size: 12px;`;
  }

  // Use Svelte 5 $state.raw for nodes and edges
  let nodes = $state.raw<Node[]>([]);
  let edges = $state.raw<Edge[]>([]);

  // Update when graph changes
  $effect(() => {
    const updated = convertToFlowGraph(graph);
    nodes = updated.nodes;
    edges = updated.edges;
  });
</script>

<div class="graph-container">
  <SvelteFlow {nodes} {edges} fitView>
    <Controls />
    <Background />
    <MiniMap />
  </SvelteFlow>
</div>

<style>
  .graph-container {
    width: 100%;
    height: 600px;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
  }

  :global(.svelte-flow) {
    background: #fafafa;
  }

  :global(.svelte-flow__node) {
    cursor: grab;
  }

  :global(.svelte-flow__node:active) {
    cursor: grabbing;
  }

  :global(.svelte-flow__edge-path) {
    stroke: #888;
    stroke-width: 2;
  }

  :global(.svelte-flow__edge.animated path) {
    stroke-dasharray: 5;
    animation: dashdraw 0.5s linear infinite;
  }

  @keyframes dashdraw {
    to {
      stroke-dashoffset: -10;
    }
  }
</style>

