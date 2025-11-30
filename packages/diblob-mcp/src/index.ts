/**
 * @speajus/diblob-mcp
 * 
 * Model Context Protocol (MCP) server implementation for diblob dependency injection containers.
 * 
 * This package provides an MCP server that exposes diblob container functionality through
 * the Model Context Protocol, enabling AI assistants and other MCP clients to interact
 * with your dependency injection containers.
 * 
 * @example
 * ```typescript
 * import { createContainer } from '@speajus/diblob';
 * import { registerMcpBlobs, mcpServer } from '@speajus/diblob-mcp';
 * 
 * // Create a diblob container
 * const container = createContainer();
 * 
 * // Register MCP server blobs
 * registerMcpBlobs(container);
 * 
 * // Start the MCP server
 * await mcpServer.start();
 * ```
 */


// Export types
export type {
  ContainerIntrospector,
  McpServer,
  McpServerConfig,
  McpTransport,
} from './blobs.js';

// Export blob declarations
export {
  containerIntrospector,
  mcpServer,
  mcpServerConfig,
  mcpTransport,
} from './blobs.js';

	// Export configuration schema
	export { McpServerConfigSchema } from './config.js';
// Export registration function
export { registerMcpBlobs } from './register.js';

// Export implementations (for advanced use cases)
export {
  ContainerIntrospectorImpl,
  McpServerImpl,
  StdioMcpTransport,
} from './server.js';

