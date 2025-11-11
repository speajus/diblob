/**
 * Blob and interface definitions for gRPC server
 *
 * This file contains type definitions and blob declarations following
 * diblob architecture patterns.
 */

import { createBlob } from '@speajus/diblob';
import type { DescService } from '@bufbuild/protobuf';
import type { ServiceImpl } from '@connectrpc/connect';
import type { Server as NodeHttpServer } from 'node:http';

/**
 * Configuration for the gRPC (Connect) server
 */
export interface GrpcServerConfig {
  /**
   * Host to bind the server to
   * @default '0.0.0.0'
   */
  host?: string;

  /**
   * Port to bind the server to
   * @default 50051
   */
  port?: number;

  /**
   * Optional request path prefix for all RPCs (for example, "/api")
   *
   * This is passed through to Connect's Node adapter and is useful when you
   * want to serve your RPCs under a common URL prefix.
   */
  requestPathPrefix?: string;
}

/**
 * gRPC Server interface
 *
 * This is implemented via Connect-ES and Node's HTTP server. The underlying
 * transport speaks Connect, gRPC, and gRPC-web protocols.
 */
export interface GrpcServer {
  /**
   * Get the underlying Node HTTP server instance, if the server has been
   * started. This is primarily for advanced scenarios like custom shutdown
   * or inspection.
   */
  getServer(): NodeHttpServer | null;

  /**
   * Register a service implementation with the server.
   *
   * This is a convenience that forwards to the GrpcServiceRegistry. In most
   * cases you should prefer injecting and using {@link GrpcServiceRegistry}
   * directly.
   */
  addService<S extends DescService>(
    service: S,
    implementation: Partial<ServiceImpl<S>>
  ): void;

  /**
   * Start the gRPC server
   * @returns Promise that resolves when the server is started
   */
  start(): Promise<void>;

  /**
   * Stop the gRPC server
   * @returns Promise that resolves when the server is stopped
   */
  stop(): Promise<void>;

  /**
   * Check if the server is running
   */
  isRunning(): boolean;

  /**
   * Get the server address
   */
  getAddress(): string | null;
}

/**
 * Service registry for managing gRPC service implementations
 */
export interface GrpcServiceRegistry {
  /**
   * Register a gRPC service implementation
   *
   * @param service - The service descriptor from codegen (DescService)
   * @param implementation - The service implementation object
   */
  registerService<S extends DescService>(
    service: S,
    implementation: Partial<ServiceImpl<S>>
  ): void;

  /**
   * Get all registered services
   */
  getServices(): Array<{
    service: DescService;
    implementation: Partial<ServiceImpl<DescService>>;
  }>;
}

// Blob declarations
export const grpcServerConfig = createBlob<GrpcServerConfig>('grpcServerConfig', {
  name: 'gRPC Server Configuration',
  description: 'Configuration for the gRPC server',
});

export const grpcServer = createBlob<GrpcServer>('grpcServer', {
  name: 'gRPC Server',
  description: 'gRPC server instance',
});

export const grpcServiceRegistry = createBlob<GrpcServiceRegistry>('grpcServiceRegistry', {
  name: 'gRPC Service Registry',
  description: 'Registry for managing gRPC service implementations',
});
