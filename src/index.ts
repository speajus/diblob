/**
 * diblob - A dependency injection framework where the proxy (blob) is the key
 * 
 * @example
 * ```typescript
 * import { createBlob, createContainer } from 'diblob';
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

export { createBlob, getBlobId, isBlob } from './blob';
export { createContainer, Container } from './container';
export type { Blob, Factory, Container as IContainer, RegistrationOptions } from './types';
export { Lifecycle } from './types';

