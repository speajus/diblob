/**
 * Blob and interface definitions for gRPC server
 * 
 * This file contains type definitions and blob declarations following
 * diblob architecture patterns.
 */

import { createBlob } from '@speajus/diblob';
import type * as grpc from '@grpc/grpc-js';

/**
 * Configuration for the gRPC server
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
   * Server credentials
   * @default grpc.ServerCredentials.createInsecure()
   */
  credentials?: grpc.ServerCredentials;

  /**
   * Additional server options
   */
  options?: grpc.ChannelOptions;
}

/**
 * gRPC Server interface
 * Wraps the @grpc/grpc-js Server
 */
export interface GrpcServer {
  /**
   * Get the underlying gRPC server instance
   */
  getServer(): grpc.Server;

  /**
   * Add a service to the gRPC server
   * 
   * @param serviceDefinition - The service definition from proto-loader
   * @param implementation - The service implementation object
   */
  addService(
    serviceDefinition: grpc.ServiceDefinition,
    implementation: grpc.UntypedServiceImplementation
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
   * @param serviceDefinition - The service definition from proto-loader
   * @param implementation - The service implementation object
   */
  registerService(
    serviceDefinition: grpc.ServiceDefinition,
    implementation: grpc.UntypedServiceImplementation
  ): void;

  /**
   * Get all registered services
   */
  getServices(): Array<{
    definition: grpc.ServiceDefinition;
    implementation: grpc.UntypedServiceImplementation;
  }>;
}

// Blob declarations
export const grpcServerConfig = createBlob<GrpcServerConfig>('grpcServerConfig', {
  name: 'gRPC Server Configuration',
  description: 'Configuration for the gRPC server'
});

export const grpcServer = createBlob<GrpcServer>('grpcServer', {
  name: 'gRPC Server',
  description: 'gRPC server instance'
});

export const grpcServiceRegistry = createBlob<GrpcServiceRegistry>('grpcServiceRegistry', {
  name: 'gRPC Service Registry',
  description: 'Registry for managing gRPC service implementations'
});

