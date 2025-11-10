/**
 * Blob and interface definitions for MCP server
 * 
 * This file contains type definitions and blob declarations following
 * diblob architecture patterns.
 */

import { createBlob } from '@speajus/diblob';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

/**
 * Configuration for the MCP server
 */
export interface McpServerConfig {
  /**
   * Name of the MCP server
   */
  name: string;

  /**
   * Version of the MCP server
   */
  version: string;

  /**
   * Optional description
   */
  description?: string;
}

/**
 * MCP Server interface
 * Wraps the @modelcontextprotocol/sdk Server
 */
export interface McpServer {
  /**
   * Get the underlying MCP SDK server instance
   */
  getServer(): Server;

  /**
   * Start the MCP server with stdio transport
   */
  start(): Promise<void>;

  /**
   * Stop the MCP server
   */
  stop(): Promise<void>;

  /**
   * Check if the server is running
   */
  isRunning(): boolean;
}

/**
 * MCP Transport interface
 * Manages the transport layer for MCP communication
 */
export interface McpTransport {
  /**
   * Get the stdio transport instance
   */
  getTransport(): StdioServerTransport;

  /**
   * Connect the transport
   */
  connect(): Promise<void>;

  /**
   * Close the transport
   */
  close(): Promise<void>;
}

/**
 * Container introspection service
 * Provides tools for inspecting diblob containers through MCP
 */
export interface ContainerIntrospector {
  /**
   * List all registered blobs in the container
   */
  listBlobs(): Promise<Array<{
    id: string;
    name?: string;
    description?: string;
    lifecycle: string;
  }>>;

  /**
   * Get details about a specific blob
   */
  getBlobDetails(blobId: string): Promise<{
    id: string;
    name?: string;
    description?: string;
    lifecycle: string;
    dependencies: string[];
  } | null>;

  /**
   * Get dependency graph
   */
  getDependencyGraph(): Promise<{
    nodes: Array<{ id: string; name?: string }>;
    edges: Array<{ from: string; to: string }>;
  }>;
}

// Blob declarations
export const mcpServerConfig = createBlob<McpServerConfig>('mcpServerConfig', {
  name: 'MCP Server Configuration',
  description: 'Configuration for the Model Context Protocol server'
});

export const mcpServer = createBlob<McpServer>('mcpServer', {
  name: 'MCP Server',
  description: 'Model Context Protocol server instance'
});

export const mcpTransport = createBlob<McpTransport>('mcpTransport', {
  name: 'MCP Transport',
  description: 'Transport layer for MCP communication'
});

export const containerIntrospector = createBlob<ContainerIntrospector>('containerIntrospector', {
  name: 'Container Introspector',
  description: 'Service for introspecting diblob containers'
});

