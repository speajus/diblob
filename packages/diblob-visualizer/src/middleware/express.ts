/**
 * Express middleware for diblob-visualizer
 * 
 * Provides middleware that can be embedded into existing Express/Node.js servers
 */

import type { Request, Response, NextFunction } from 'express';
import type { Container } from '@speajus/diblob';
import { extractDependencyGraph, getGraphStats } from '../lib/container-introspection.js';

export interface MiddlewareOptions {
  container: Container;
  path?: string;
  updateInterval?: number;
  cors?: boolean;
}

export interface GraphUpdate {
  type: 'graph';
  timestamp: number;
  graph: ReturnType<typeof extractDependencyGraph>;
  stats: ReturnType<typeof getGraphStats>;
}

/**
 * Create Express middleware for the diblob visualizer
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import { createVisualizerMiddleware } from '@speajus/diblob-visualizer/middleware';
 * 
 * const app = express();
 * app.use('/visualizer', createVisualizerMiddleware({ container }));
 * ```
 */
export function createVisualizerMiddleware(options: MiddlewareOptions) {
  const {
    container,
    path = '/visualizer',
    updateInterval = 1000,
    cors = true
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

  return function diblobVisualizerMiddleware(req: Request, res: Response, next: NextFunction) {
    // Only handle requests under the specified path
    if (!req.path.startsWith(path)) {
      return next();
    }

    // CORS headers
    if (cors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    const subPath = req.path.substring(path.length);

    // SSE endpoint
    if (subPath === '/events' && req.method === 'GET') {
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
    if (subPath === '/graph' && req.method === 'GET') {
      const data = getGraphData();
      res.json(data);
      return;
    }

    // Health check
    if (subPath === '/health' && req.method === 'GET') {
      res.json({ status: 'ok' });
      return;
    }

    // If no route matched, pass to next middleware
    next();
  };
}

/**
 * Type-safe Express middleware type
 */
export type DiblobVisualizerMiddleware = ReturnType<typeof createVisualizerMiddleware>;

