/**
 * Type definitions for diblob-visualizer server
 */

import type { Container } from '@speajus/diblob';
import type { Server } from 'http';

export interface ServerOptions {
  port?: number;
  host?: string;
  cors?: boolean;
  updateInterval?: number;
}

export interface GraphUpdate {
  type: 'graph';
  timestamp: number;
  graph: any;
  stats: any;
}

export interface VisualizerServer {
  server: Server;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export function createVisualizerServer(
  container: Container,
  options?: ServerOptions
): VisualizerServer;

