/**
 * gRPC Server implementation (Connect-ES based)
 *
 * Concrete implementations of gRPC server interfaces following diblob
 * architecture patterns, using Connect-ES and Node's HTTP server under
 * the hood.
 */

import * as http from 'node:http';
import { connectNodeAdapter } from '@connectrpc/connect-node';
import type { DescService } from '@bufbuild/protobuf';
import type { ServiceImpl } from '@connectrpc/connect';
import type {
  GrpcServer,
  GrpcServerConfig,
  GrpcServiceRegistry,
} from './blobs.js';

/**
 * Default gRPC server configuration
 */
const DEFAULT_CONFIG: Required<GrpcServerConfig> = {
  host: '0.0.0.0',
  port: 50051,
  requestPathPrefix: '',
};

type ServiceRegistration<S extends DescService = DescService> = {
  service: S;
  implementation: ServiceImpl<S>;
};

/**
 * gRPC Service Registry implementation
 */
export class GrpcServiceRegistryImpl implements GrpcServiceRegistry {
  private services: ServiceRegistration[] = [];

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

  constructor(
    config: GrpcServerConfig,
    private readonly serviceRegistry: GrpcServiceRegistry,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
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
          // We intentionally erase the generic type information when wiring
          // up services, but the registration side is fully type-safe.
          router.service(service as DescService, implementation as any);
        }
      },
    });

    const server = http.createServer(handler);
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
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.running || !this.server) {
      return;
    }

    const server = this.server;
    this.server = null;

    await new Promise<void>((resolve) => {
      server.close(() => {
        this.running = false;
        this.address = null;
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
