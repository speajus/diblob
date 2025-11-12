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
	import  type { Container as _Container } from './types.js';
	export type { Blob, Factory, RegistrationOptions, BlobMetadata } from './types.js';
	export  { Lifecycle } from './types.js';
	export { createBlob, getBlobId, isBlob, getBlobMetadata } from './blob.js';
	export { createContainer, getContainerMetadata } from './container.js';
	export { createListBlob } from './list-blob.js';
export type IContainer  =  _Container;
export type Container = _Container;
