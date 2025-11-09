/**
 * Web Component entry point for diblob-visualizer
 * 
 * This exports a framework-agnostic web component that can be used in any web application
 */

// Import the web component - this will register it automatically
import './DiblobVisualizerElement.svelte';

// Export type definitions for TypeScript users
export interface DiblobVisualizerElementAttributes {
  url?: string;
  mode?: 'local' | 'remote';
  updateInterval?: number;
}

// Augment the global HTMLElementTagNameMap for TypeScript
declare global {
  interface HTMLElementTagNameMap {
    'diblob-visualizer': HTMLElement & DiblobVisualizerElementAttributes;
  }
}

