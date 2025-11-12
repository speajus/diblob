/**
 * Registration function for gRPC blobs
 *
 * Following diblob architecture patterns, this file contains the registration
 * function that accepts a container parameter and registers all gRPC-related blobs.
 */

import type { Container } from '@speajus/diblob';
import { Lifecycle } from '@speajus/diblob';
import {
  grpcServerConfig,
  grpcServer,
  grpcServiceRegistry,
  type GrpcServerConfig,
  grpcServiceList
} from './blobs.js';
import {
	  GrpcServerImpl,
	  GrpcServiceRegistryImpl
	} from './server.js';
import { logger as loggerBlob } from '@speajus/diblob-logger';

/**
 * Default gRPC server configuration
 */
const DEFAULT_CONFIG: GrpcServerConfig = {
  host: '0.0.0.0',
  port: 50051
};

/**
 * Register all gRPC-related blobs with the provided container
 * 
 * This function follows the diblob pattern of grouping related blob
 * registrations into a single function that accepts a container parameter.
 * 
 * @param container - The diblob container to register gRPC blobs with
 * @param config - Optional custom configuration for the gRPC server
 * 
 * @example
 * ```typescript
 * import { createContainer } from '@speajus/diblob';
 * import { registerGrpcBlobs } from '@speajus/diblob-connect';
 * 
 * const container = createContainer();
 * registerGrpcBlobs(container);
 * ```
 * 
 * @example
 * ```typescript
 * // With custom configuration
 * import { createContainer } from '@speajus/diblob';
 * import { registerGrpcBlobs } from '@speajus/diblob-connect';
 * 
 * const container = createContainer();
 * registerGrpcBlobs(container, {
 *   host: 'localhost',
 *   port: 9090
 * });
 * ```
 */
export function registerGrpcBlobs(
		  container: Container,
		  config: Partial<GrpcServerConfig> = {}
		): void {
  // Merge provided config with defaults
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  container.register(grpcServiceList, () => []);
  // Register server configuration
  container.register(grpcServerConfig, () => finalConfig);

  // Register service registry
  container.register(grpcServiceRegistry, GrpcServiceRegistryImpl);

	 // Register gRPC server with its dependencies and lifecycle hooks
	  container.register(
		    grpcServer,
		    GrpcServerImpl,
		    grpcServerConfig,
		    grpcServiceRegistry,
		    loggerBlob,
		    {
		      lifecycle: Lifecycle.Singleton,
		      initialize: 'start',
		      dispose: 'stop',
		    }
		  );
}

