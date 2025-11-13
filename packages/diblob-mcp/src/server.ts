/**
 * MCP Server implementation
 *
 * Concrete implementations of MCP server interfaces following
 * diblob architecture patterns.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Container } from '@speajus/diblob';
import type {
  ContainerIntrospector, 
  McpServer,
  McpServerConfig,
  McpTransport
} from './blobs.js';

/**
 * MCP Transport implementation using stdio
 */
export class StdioMcpTransport implements McpTransport {
  private transport: StdioServerTransport;

  constructor() {
    this.transport = new StdioServerTransport();
  }

  getTransport(): StdioServerTransport {
    return this.transport;
  }

  async connect(): Promise<void> {
    // Transport connection is handled by the server
    return Promise.resolve();
  }

  async close(): Promise<void> {
    await this.transport.close();
  }
}

/**
 * MCP Server implementation
 */
export class McpServerImpl implements McpServer {
  private server: Server;
  private running: boolean = false;

  constructor(config: McpServerConfig,
    private transport: McpTransport,
    private introspector: ContainerIntrospector
  ) {
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
  }

  private setupTools(): void {
    // List all blobs in the container
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_blobs',
          description: 'List all registered blobs in the diblob container',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_blob_details',
          description: 'Get detailed information about a specific blob',
          inputSchema: {
            type: 'object',
            properties: {
              blobId: {
                type: 'string',
                description: 'The ID of the blob to inspect',
              },
            },
            required: ['blobId'],
          },
        },
        {
          name: 'get_dependency_graph',
          description: 'Get the dependency graph of all blobs in the container',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'list_blobs': {
          const blobs = await this.introspector.listBlobs();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(blobs, null, 2),
              },
            ],
          };
        }

        case 'get_blob_details': {
          const blobId = (args as any).blobId;
          const details = await this.introspector.getBlobDetails(blobId);
          return {
            content: [
              {
                type: 'text',
                text: details ? JSON.stringify(details, null, 2) : 'Blob not found',
              },
            ],
          };
        }

        case 'get_dependency_graph': {
          const graph = await this.introspector.getDependencyGraph();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(graph, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  getServer(): Server {
    return this.server;
  }

  async start(): Promise<void> {
    if (this.running) {
      throw new Error('Server is already running');
    }

    await this.server.connect(this.transport.getTransport());
    this.running = true;
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    await this.transport.close();
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }
}

/**
 * Container introspector implementation
 */
export class ContainerIntrospectorImpl implements ContainerIntrospector {
  constructor(private container: Container) {}

  async listBlobs(): Promise<Array<{
    id: string;
    name?: string;
    description?: string;
    lifecycle: string;
  }>> {
    const registrations = (this.container as any).registrations as Map<symbol, any>;
    const blobs: Array<{
      id: string;
      name?: string;
      description?: string;
      lifecycle: string;
    }> = [];

    for (const [blobId, registration] of registrations.entries()) {
      const metadata = (this.container as any).blobMetadata?.get(blobId);
      blobs.push({
        id: blobId.toString(),
        name: metadata?.name,
        description: metadata?.description,
        lifecycle: registration.lifecycle || 'Singleton',
      });
    }

    return blobs;
  }

  async getBlobDetails(blobId: string): Promise<{
    id: string;
    name?: string;
    description?: string;
    lifecycle: string;
    dependencies: string[];
  } | null> {
    const registrations = (this.container as any).registrations as Map<symbol, any>;

    for (const [id, registration] of registrations.entries()) {
      if (id.toString() === blobId) {
        const metadata = (this.container as any).blobMetadata?.get(id);
        const dependencies = registration.deps
          ?.filter((dep: any) => typeof dep === 'symbol')
          .map((dep: symbol) => dep.toString()) || [];

        return {
          id: id.toString(),
          name: metadata?.name,
          description: metadata?.description,
          lifecycle: registration.lifecycle || 'Singleton',
          dependencies,
        };
      }
    }

    return null;
  }

  async getDependencyGraph(): Promise<{
    nodes: Array<{ id: string; name?: string }>;
    edges: Array<{ from: string; to: string }>;
  }> {
    const registrations = (this.container as any).registrations as Map<symbol, any>;
    const nodes: Array<{ id: string; name?: string }> = [];
    const edges: Array<{ from: string; to: string }> = [];

    for (const [blobId, registration] of registrations.entries()) {
      const metadata = (this.container as any).blobMetadata?.get(blobId);
      nodes.push({
        id: blobId.toString(),
        name: metadata?.name,
      });

      const dependencies = registration.deps
        ?.filter((dep: any) => typeof dep === 'symbol')
        .map((dep: symbol) => dep.toString()) || [];

      for (const depId of dependencies) {
        edges.push({
          from: blobId.toString(),
          to: depId,
        });
      }
    }

    return { nodes, edges };
  }
}

