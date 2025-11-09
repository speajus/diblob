/**
 * Type definitions for diblob-visualizer Express middleware
 */

import type { Request, Response, NextFunction } from 'express';
import type { Container } from '@speajus/diblob';

export interface MiddlewareOptions {
  container: Container;
  path?: string;
  updateInterval?: number;
  cors?: boolean;
}

export interface GraphUpdate {
  type: 'graph';
  timestamp: number;
  graph: any;
  stats: any;
}

export type DiblobVisualizerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

export function createVisualizerMiddleware(
  options: MiddlewareOptions
): DiblobVisualizerMiddleware;

