/**
	 * Visualizer server for the example gRPC application
	 *
	 * Delegates to the shared @speajus/diblob-visualizer server so the example
	 * can serve the full visualizer UI (index.html + assets) and SSE endpoints
	 * with the same container.
	 */

	import type { Container } from '@speajus/diblob';
	import { createBlob, Lifecycle } from '@speajus/diblob';
	import {
		createVisualizerServer,
		type ServerOptions as VisualizerServerConfig,
	} from '@speajus/diblob-visualizer/server';

	export interface VisualizerServer {
		start(): Promise<void>;
		stop(): Promise<void>;
	}

	export const visualizerServerConfig = createBlob<VisualizerServerConfig>(
	'visualizerServerConfig',
	{
		name: 'Visualizer Server Config',
		description: 'Configuration for the diblob visualizer HTTP server',
	},
);

export const visualizerServer = createBlob<VisualizerServer>('visualizerServer', {
	name: 'Visualizer Server',
	description: 'HTTP server exposing container graph for diblob-visualizer',
});

	class VisualizerServerImpl implements VisualizerServer {
		private innerServer: ReturnType<typeof createVisualizerServer> | null = null;
		private running = false;

		constructor(
			private readonly container: Container,
			private readonly config: VisualizerServerConfig,
		) {}

		async start(): Promise<void> {
			if (this.running) {
				return;
			}

			this.innerServer = createVisualizerServer(this.container, this.config);
			await this.innerServer.start();
			this.running = true;
		}

		async stop(): Promise<void> {
			if (!this.running || !this.innerServer) {
				return;
			}

			await this.innerServer.stop();
			this.running = false;
			this.innerServer = null;
		}
	}

export function registerVisualizerBlobs(
	container: Container,
	config: VisualizerServerConfig = {},
): void {
	const defaultConfig: Required<VisualizerServerConfig> = {
		host: '0.0.0.0',
		port: 3001,
		cors: true,
		updateInterval: 1000,
	};
	const finalConfig: VisualizerServerConfig = { ...defaultConfig, ...config };

	container.register(visualizerServerConfig, () => finalConfig);

	container.register(
		visualizerServer,
		VisualizerServerImpl,
		container,
		visualizerServerConfig,
		{
			lifecycle: Lifecycle.Singleton,
			initialize: 'start',
			dispose: 'stop',
		},
	);
}

