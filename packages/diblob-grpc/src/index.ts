/**
 * @speajus/diblob-grpc
 * 
 * gRPC server implementation for diblob dependency injection containers,
 * backed by Connect-ES and Node's HTTP server.
 *
 * @example
 * ```typescript
 * import { createContainer } from '@speajus/diblob';
 * import {
 *   registerGrpcBlobs,
 *   grpcServer,
 *   grpcServiceRegistry,
 * } from '@speajus/diblob-grpc';
 *
 * const container = createContainer();
 * registerGrpcBlobs(container, { port: 50051 });
 *
 * // Register your RPC services using the service registry. If you use Buf
 * // and Connect-compatible codegen, the service descriptor and
 * // implementation will be fully type-safe:
 * //
 * //   grpcServiceRegistry.registerService(YourService, yourImpl);
 * //
 * // The server blob is wired with lifecycle hooks, so resolving it starts
 * // the HTTP server automatically:
 * await container.resolve(grpcServer);
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

