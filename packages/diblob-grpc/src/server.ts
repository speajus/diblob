/**
 * gRPC Server implementation
 *
 * Concrete implementations of gRPC server interfaces following
 * diblob architecture patterns.
 */

import * as grpc from '@grpc/grpc-js';
import type {
  GrpcServer,
  GrpcServerConfig,
  GrpcServiceRegistry
} from './blobs.js';

/**
 * Default gRPC server configuration
 */
const DEFAULT_CONFIG: Required<GrpcServerConfig> = {
  host: '0.0.0.0',
  port: 50051,
  credentials: grpc.ServerCredentials.createInsecure(),
  options: {}
};

/**
 * gRPC Service Registry implementation
 */
export class GrpcServiceRegistryImpl implements GrpcServiceRegistry {
  private services: Array<{
    definition: grpc.ServiceDefinition;
    implementation: grpc.UntypedServiceImplementation;
  }> = [];

  registerService(
    serviceDefinition: grpc.ServiceDefinition,
    implementation: grpc.UntypedServiceImplementation
  ): void {
    this.services.push({ definition: serviceDefinition, implementation });
  }

  getServices(): Array<{
    definition: grpc.ServiceDefinition;
    implementation: grpc.UntypedServiceImplementation;
  }> {
    return [...this.services];
  }
}

/**
 * gRPC Server implementation
 */
export class GrpcServerImpl implements GrpcServer {
  private server: grpc.Server;
  private running: boolean = false;
  private address: string | null = null;
  private config: Required<GrpcServerConfig>;

  constructor(
    config: GrpcServerConfig,
    private serviceRegistry: GrpcServiceRegistry
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.server = new grpc.Server(this.config.options);
  }

  getServer(): grpc.Server {
    return this.server;
  }

  addService(
    serviceDefinition: grpc.ServiceDefinition,
    implementation: grpc.UntypedServiceImplementation
  ): void {
    // Only register in the service registry
    // The actual server.addService() will be called in start()
    this.serviceRegistry.registerService(serviceDefinition, implementation);
  }

  async start(): Promise<void> {
    if (this.running) {
      throw new Error('Server is already running');
    }

    // Register all services from the registry
    const services = this.serviceRegistry.getServices();
    for (const { definition, implementation } of services) {
      this.server.addService(definition, implementation);
    }

    const bindAddress = `${this.config.host}:${this.config.port}`;

    return new Promise((resolve, reject) => {
      this.server.bindAsync(
        bindAddress,
        this.config.credentials,
        (error, port) => {
          if (error) {
            reject(error);
            return;
          }

          this.address = `${this.config.host}:${port}`;
          this.running = true;
          resolve();
        }
      );
    });
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    return new Promise((resolve) => {
      this.server.tryShutdown(() => {
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

