/**
 * Diblob Visualizer Server
 *
 * Exposes container introspection data via SSE and REST API
 */

import { createServer } from 'node:http';
import type { Container } from '@speajus/diblob';
import { extractDependencyGraph, getGraphStats } from '../lib/container-introspection.js';

export interface ServerOptions {
  port?: number;
  host?: string;
  cors?: boolean;
  updateInterval?: number;
}

export interface GraphUpdate {
  type: 'graph';
  timestamp: number;
  graph: ReturnType<typeof extractDependencyGraph>;
  stats: ReturnType<typeof getGraphStats>;
}

/**
 * Create a server that exposes container data via SSE
 */
export function createVisualizerServer(container: Container, options: ServerOptions = {}) {
  const {
    port = 3001,
    host = 'localhost',
    cors = true,
    updateInterval = 1000
  } = options;

  // Get current graph data
  function getGraphData(): GraphUpdate {
    const graph = extractDependencyGraph(container);
    const stats = getGraphStats(graph);
    return {
      type: 'graph',
      timestamp: Date.now(),
      graph,
      stats
    };
  }

  const server = createServer((req, res) => {
    // CORS headers
    if (cors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // SSE endpoint
    if (req.url === '/events' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...(cors ? { 'Access-Control-Allow-Origin': '*' } : {})
      });

      // Send initial data
      const initialData = getGraphData();
      res.write(`data: ${JSON.stringify(initialData)}\n\n`);

      // Send updates periodically
      const interval = setInterval(() => {
        const data = getGraphData();
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }, updateInterval);

      req.on('close', () => {
        clearInterval(interval);
      });

      return;
    }

    // REST endpoint for one-time fetch
    if (req.url === '/graph' && req.method === 'GET') {
      const data = getGraphData();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    // Health check
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    // 404
    res.writeHead(404);
    res.end('Not Found');
  });

  return {
    server,
    start: () => {
      return new Promise<void>((resolve) => {
        server.listen(port, host, () => {
          console.log(`Diblob Visualizer Server running at:`);
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
    }
  };
}


