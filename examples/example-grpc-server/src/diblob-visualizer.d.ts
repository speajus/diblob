/**
 * Minimal TypeScript declarations for the diblob-visualizer package, which is
 * currently distributed as JavaScript without its own type definitions.
 */

declare module '@speajus/diblob-visualizer' {
	export function extractDependencyGraph(
		container: import('@speajus/diblob').Container,
	): unknown;

	export function getGraphStats(graph: unknown): unknown;
}

