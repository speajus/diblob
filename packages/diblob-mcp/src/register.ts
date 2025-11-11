/**
 * Registration function for MCP blobs
 * 
 * Following diblob architecture patterns, this file contains the registration
 * function that accepts a container parameter and registers all MCP-related blobs.
 */

import type { Container } from '@speajus/diblob';
import { Lifecycle } from '@speajus/diblob';
import {
	  mcpServerConfig,
	  mcpServer,
	  mcpTransport,
	  containerIntrospector,
	} from './blobs.js';
import {
  McpServerImpl,
  StdioMcpTransport,
  ContainerIntrospectorImpl,
} from './server.js';

/**
 * Default MCP server configuration
 */
const DEFAULT_CONFIG = {
  name: 'diblob-mcp-server',
  version: '0.1.0',
  description: 'Model Context Protocol server for diblob containers',
};

/**
 * Register all MCP-related blobs with the provided container
 * 
 * This function follows the diblob pattern of grouping related blob
 * registrations into a single function that accepts a container parameter.
 * 
 * @param container - The diblob container to register MCP blobs with
 * @param config - Optional custom configuration for the MCP server
 * 
 * @example
 * ```typescript
 * import { createContainer } from '@speajus/diblob';
 * import { registerMcpBlobs } from '@speajus/diblob-mcp';
 * 
 * const container = createContainer();
 * registerMcpBlobs(container);
 * ```
 * 
 * @example
 * ```typescript
 * // With custom configuration
 * import { createContainer } from '@speajus/diblob';
 * import { registerMcpBlobs } from '@speajus/diblob-mcp';
 * 
 * const container = createContainer();
 * registerMcpBlobs(container, {
 *   name: 'my-custom-mcp-server',
 *   version: '1.0.0',
 *   description: 'Custom MCP server'
 * });
 * ```
 */
export function registerMcpBlobs(
  container: Container,
  config: Partial<typeof DEFAULT_CONFIG> = {}
): void {
  // Merge provided config with defaults
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Register server configuration
  container.register(mcpServerConfig, () => finalConfig);

  // Register transport
  container.register(mcpTransport, StdioMcpTransport);

  // Register container introspector with the container as a dependency
  container.register(
    containerIntrospector,
    () => new ContainerIntrospectorImpl(container)
  );

  // Register MCP server with all its dependencies
	  container.register(
	    mcpServer,
	    McpServerImpl,
	    mcpServerConfig,
	    mcpTransport,
	    containerIntrospector,
	    {
	      lifecycle: Lifecycle.Singleton,
	      initialize: 'start',
	      dispose: 'stop',
	    }
	  );
}

