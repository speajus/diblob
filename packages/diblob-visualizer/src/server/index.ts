/**
 * Diblob Visualizer Server & Middleware
 *
 * Exposes container introspection data via SSE and REST API and can
 * optionally serve the built visualizer UI (index.html + assets).
 */

import { createReadStream } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Container } from '@speajus/diblob';
import { createBlob, Lifecycle } from '@speajus/diblob';
import { extractDependencyGraph, getGraphStats } from '../lib/container-introspection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_ROOT = join(__dirname, '../../dist');

export interface ServerOptions {
  port?: number;
  host?: string;
  cors?: boolean;
  updateInterval?: number;
  /** When true, serve the built visualizer UI from the dist folder. */
  serveStatic?: boolean;
}

export interface GraphUpdate {
  type: 'graph';
  timestamp: number;
  graph: ReturnType<typeof extractDependencyGraph>;
  stats: ReturnType<typeof getGraphStats>;
}

export type VisualizerMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next?: () => void,
) => void;

function calculateGraphUpdate(container: Container): GraphUpdate {
  const graph = extractDependencyGraph(container);
  const stats = getGraphStats(graph);
  return {
    type: 'graph',
    timestamp: Date.now(),
    graph,
    stats,
  };
}

function resolveAssetPath(pathname: string): string | null {
  const [rawPath] = pathname.split('?', 1);
  const safePath = rawPath || '/';
  const relative = safePath === '/' ? 'index.html' : safePath.replace(/^\/+/, '');

  // Very small safety guard against path traversal
  if (relative.includes('..')) {
    return null;
  }

  return join(DIST_ROOT, relative);
}

function lookupContentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.json':
      return 'application/json; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

function serveStaticFile(res: ServerResponse, filePath: string, contentType: string): void {
  const stream = createReadStream(filePath);

  stream.once('open', () => {
    if (!res.headersSent) {
      res.writeHead(200, { 'Content-Type': contentType });
    }
  });

  stream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(404);
    }
    if (!res.writableEnded) {
      res.end('Not Found');
    }
  });

  stream.pipe(res);
}

/**
 * Create a reusable HTTP middleware that:
 * - Exposes the container graph via SSE (/events), JSON (/graph), and /health
 * - Optionally serves the built visualizer UI from dist (index.html + assets)
 */
export function createVisualizerMiddleware(
  container: Container,
  options: ServerOptions = {},
): VisualizerMiddleware {
  const {
    cors = true,
    updateInterval = 1000,
    serveStatic = true,
  } = options;

  return (req, res, next) => {
    const method = req.method ?? 'GET';
    const url = req.url ?? '/';
    const [pathname] = url.split('?', 1);

    if (cors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // SSE endpoint
    if (method === 'GET' && pathname === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        ...(cors ? { 'Access-Control-Allow-Origin': '*' } : {}),
      });

      const initial = calculateGraphUpdate(container);
      res.write(`data: ${JSON.stringify(initial)}\n\n`);

      const intervalId = setInterval(() => {
        const update = calculateGraphUpdate(container);
        res.write(`data: ${JSON.stringify(update)}\n\n`);
      }, updateInterval);

      req.on('close', () => {
        clearInterval(intervalId);
      });

      return;
    }

    // REST endpoint for one-time fetch
    if (method === 'GET' && pathname === '/graph') {
      const data = calculateGraphUpdate(container);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    // Health check
    if (method === 'GET' && pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    // Static UI assets (index.html, index.js, index.css, vite.svg, ...)
    if (serveStatic && method === 'GET') {
      const assetPath = resolveAssetPath(pathname || '/');
      if (assetPath) {
        const contentType = lookupContentType(assetPath);
        serveStaticFile(res, assetPath, contentType);
        return;
      }
    }

    if (next) {
      next();
      return;
    }

    if (!res.writableEnded) {
      res.writeHead(404);
      res.end('Not Found');
    }
  };
}

/**
 * Create a standalone HTTP server using the visualizer middleware.
 *
 * This keeps the existing createVisualizerServer API but now also
 * serves the built visualizer UI by default.
 */
export function createVisualizerServer(container: Container, options: ServerOptions = {}) {
  const {
    port = 3001,
    host = 'localhost',
    ...middlewareOptions
  } = options;

  const middleware = createVisualizerMiddleware(container, middlewareOptions);

  const server = createServer((req, res) => {
    middleware(req, res);
  });

  return {
    server,
    start: () => {
      return new Promise<void>((resolve) => {
        server.listen(port, host, () => {
          console.log('Diblob Visualizer Server running at:');
          console.log(`  UI:        http://${host}:${port}/`);
          console.log(`  SSE:       http://${host}:${port}/events`);
          console.log(`  Graph API: http://${host}:${port}/graph`);
          console.log(`  Health:    http://${host}:${port}/health`);
          resolve();
        });
      });
    },
    stop: () => {
      return new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    },
  };
}

export { extractDependencyGraph, getGraphStats };

//
// Diblob integration helpers
//

export interface VisualizerServer {
	start(): Promise<void>;
	stop(): Promise<void>;
}

export type VisualizerServerConfig = ServerOptions;

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
	private readonly container: Container;
	private readonly config: VisualizerServerConfig;

	constructor(container: Container, config: VisualizerServerConfig) {
		this.container = container;
		this.config = config;
	}

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
		serveStatic: true,
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

