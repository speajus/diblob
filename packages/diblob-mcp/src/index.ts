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

// Export registration function
export { registerMcpBlobs } from './register.js';

// Export blob declarations
export {
  mcpServerConfig,
  mcpServer,
  mcpTransport,
  containerIntrospector,
} from './blobs.js';

// Export types
export type {
  McpServerConfig,
  McpServer,
  McpTransport,
  ContainerIntrospector,
} from './blobs.js';

// Export implementations (for advanced use cases)
export {
  McpServerImpl,
  StdioMcpTransport,
  ContainerIntrospectorImpl,
} from './server.js';

