/**
 * gRPC Server implementation (Connect-ES based)
 *
 * Concrete implementations of gRPC server interfaces following diblob
 * architecture patterns, using Connect-ES and Node's HTTP server under
 * the hood.
 */

import * as http from 'node:http';
import type { DescService } from '@bufbuild/protobuf';
import { cors, type ServiceImpl } from '@connectrpc/connect';
import { connectNodeAdapter } from '@connectrpc/connect-node';
import type { Logger } from '@speajus/diblob-logger';
import {
  type GrpcServer,
  type GrpcServerConfig,
  type GrpcServiceRegistry,
  grpcServiceList,
  type ServiceRegistration,
} from './blobs.js';

/**
 * Default gRPC server configuration
 */
const DEFAULT_CONFIG: Required<GrpcServerConfig> = {
	host: '0.0.0.0',
	port: 50051,
	requestPathPrefix: '',
};

const defaultLogger: Logger = {
	info(message: string, meta?: Record<string, unknown>) {
		if (meta) {
			console.log(message, meta);
		} else {
			console.log(message);
		}
	},
	warn(message: string, meta?: Record<string, unknown>) {
		if (meta) {
			console.warn(message, meta);
		} else {
			console.warn(message);
		}
	},
	error(message: string, meta?: Record<string, unknown>) {
		if (meta) {
			console.error(message, meta);
		} else {
			console.error(message);
		}
	},
	debug(message: string, meta?: Record<string, unknown>) {
		if (meta) {
			console.debug(message, meta);
		} else {
			console.debug(message);
		}
	},
};


/**
 * gRPC Service Registry implementation
 */
export class GrpcServiceRegistryImpl implements GrpcServiceRegistry {

  constructor(private readonly services = grpcServiceList) {}

  registerService<S extends DescService>(
    service: S,
    implementation: ServiceImpl<S>,
  ): void {
    this.services.push({ service, implementation });
    
  }

  getServices(): ServiceRegistration[] {
    return [...this.services];
  }
}

/**
 * gRPC Server implementation using Connect-ES and Node's HTTP server.
 */
export class GrpcServerImpl implements GrpcServer {
	  private server: http.Server | null = null;
	  private running = false;
	  private address: string | null = null;
	  private config: Required<GrpcServerConfig>;
	  private logger: Logger;

	  constructor(
	    config: GrpcServerConfig,
	    private readonly serviceRegistry: GrpcServiceRegistry,
	    logger?: Logger,
	  ) {
	    this.config = { ...DEFAULT_CONFIG, ...config };
	    this.logger = logger ?? defaultLogger;
	  }

  getServer(): http.Server | null {
    return this.server;
  }

  addService<S extends DescService>(
    service: S,
    implementation: ServiceImpl<S>,
  ): void {
    this.serviceRegistry.registerService(service, implementation);
  }

  async start(): Promise<void> {
    if (this.running) {
      throw new Error('Server is already running');
    }

	    const handler = connectNodeAdapter({
	      requestPathPrefix: this.config.requestPathPrefix,
	      routes: (router) => {
	        const services = this.serviceRegistry.getServices();
	        for (const { service, implementation } of services) {
	          router.service(service, implementation);
	        }
	      },
	    });

	    // Wrap the Connect handler with a thin CORS layer so browser-based
	    // clients (like the Svelte example app) can call the gRPC/Connect
	    // server directly during development.
	    const server = http.createServer((req, res) => {
	      const origin = req.headers.origin ?? '*';
	
	      // Basic CORS headers based on Connect's recommended values.
	      res.setHeader('Access-Control-Allow-Origin', origin);
	      res.setHeader('Vary', 'Origin');
	      res.setHeader('Access-Control-Allow-Methods', cors.allowedMethods.join(', '));
	      res.setHeader('Access-Control-Allow-Headers', cors.allowedHeaders.join(', '));
	      res.setHeader('Access-Control-Expose-Headers', cors.exposedHeaders.join(', '));
	
	      if (req.method === 'OPTIONS') {
	        res.writeHead(204);
	        res.end();
	        return;
	      }
	
	      void handler(req, res);
	    });
    this.server = server;

    await new Promise<void>((resolve, reject) => {
      server.once('error', (err) => {
        if (!this.running) {
          reject(err);
        }
      });

	      server.listen(this.config.port, this.config.host, () => {
        const info = server.address();
        if (typeof info === 'string') {
          this.address = info;
        } else if (info && typeof info === 'object') {
          this.address = `${info.address}:${info.port}`;
        } else {
          this.address = `${this.config.host}:${this.config.port}`;
	        }
	        this.running = true;
	        this.logger.info(`🚀 gRPC server running at ${this.address}`);
	        this.logger.info('Available services:');
	        for (const { service } of this.serviceRegistry.getServices()) {
	          this.logger.info(`✅  - ${service.typeName}`);
	        }
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.running || !this.server) {
      return;
    }

	    this.logger.info('🛑 Shutting down gRPC server gracefully...');
    const server = this.server;
    this.server = null;

    await new Promise<void>((resolve) => {
	      server.close(() => {
	        this.running = false;
	        this.address = null;
	        this.logger.info('✅ gRPC server stopped');
	        resolve();
	      });
    });
  }

  isRunning(): boolean {
    return this.running;
  }

  getAddress(): string | null {
    return this.address;
  }
}
