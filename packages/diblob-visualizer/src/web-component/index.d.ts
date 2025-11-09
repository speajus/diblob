/**
 * Type definitions for diblob-visualizer web component
 */

export interface DiblobVisualizerElementAttributes {
  url?: string;
  mode?: 'local' | 'remote';
  updateInterval?: number;
}

declare global {
  interface HTMLElementTagNameMap {
    'diblob-visualizer': HTMLElement & DiblobVisualizerElementAttributes;
  }
}

export {};

