/**
 * @speajus/diblob-grpc
 * 
 * gRPC server implementation for diblob dependency injection containers
 * 
 * @example
 * ```typescript
 * import { createContainer } from '@speajus/diblob';
 * import { registerGrpcBlobs, grpcServer } from '@speajus/diblob-grpc';
 * 
 * const container = createContainer();
 * registerGrpcBlobs(container, { port: 50051 });
 * 
 * // Add your gRPC services
 * grpcServer.addService(myServiceDefinition, myServiceImplementation);
 * 
 * // Start the server
 * await grpcServer.start();
 * ```
 */

// Export registration function
export { registerGrpcBlobs } from './register.js';

// Export blob declarations
export {
  grpcServerConfig,
  grpcServer,
  grpcServiceRegistry
} from './blobs.js';

// Export types
export type {
  GrpcServerConfig,
  GrpcServer,
  GrpcServiceRegistry
} from './blobs.js';

// Export implementations (for advanced use cases)
export {
  GrpcServerImpl,
  GrpcServiceRegistryImpl
} from './server.js';

