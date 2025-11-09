/**
 * diblob - A dependency injection framework where the proxy (blob) is the key
 *
 * @example
 * ```typescript
 * import { createBlob, createContainer } from '@speajus/diblob';
 *
 * interface UserService {
 *   getUser(id: number): User;
 * }
 *
 * const userService = createBlob<UserService>();
 * const container = createContainer();
 *
 * container.register(userService, () => new UserServiceImpl());
 *
 * // Pass the blob around - it acts as the interface
 * const user = userService.getUser(123);
 * ```
 */

export { createBlob, getBlobId, isBlob, getBlobMetadata } from './blob';
export { createContainer, Container, getContainerMetadata } from './container';
export { createListBlob } from './list-blob';
export type { Blob, Factory, Container as IContainer, RegistrationOptions, BlobMetadata } from './types';
export { Lifecycle } from './types';

