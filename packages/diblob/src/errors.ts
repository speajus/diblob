/**
 * Custom error classes for diblob dependency injection framework.
 *
 * These errors provide informative messages to help developers quickly
 * identify and fix issues with blob registration and resolution.
 */

/**
 * Base error class for all diblob errors.
 * Provides consistent error formatting and inheritance chain.
 */
export class DiblobError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'DiblobError';
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

/**
 * Error thrown when a blob is accessed before it has been registered with a container.
 *
 * Common causes:
 * - Forgot to call container.register() for this blob
 * - Accessing the blob before container setup is complete
 * - Using a blob from a different scope or module
 */
export class BlobNotResolvedError extends DiblobError {
	constructor(
		public readonly blobName: string,
		public readonly context: 'get' | 'set' = 'get',
	) {
		const action = context === 'get' ? 'accessing' : 'setting a property on';
		super(
			`Blob "${blobName}" is not yet resolved.\n\n` +
				`You are ${action} a blob that has not been registered with a container.\n\n` +
				`To fix this:\n` +
				`  1. Make sure the blob is registered before use:\n` +
				`     container.register(${blobName}, () => new ${blobName}Impl());\n\n` +
				`  2. Check that registration happens before this code runs\n` +
				`  3. Verify you're using the correct blob instance (not a different one with the same name)\n`,
		);
		this.name = 'BlobNotResolvedError';
	}
}

/**
 * Error thrown when attempting to resolve a blob that is not registered in the container.
 */
export class BlobNotRegisteredError extends DiblobError {
	constructor(
		public readonly blobName: string,
		public readonly containerInfo?: string,
	) {
		const containerContext = containerInfo
			? ` in container "${containerInfo}"`
			: '';
		super(
			`Blob "${blobName}" is not registered${containerContext}.\n\n` +
				`The container does not have a registration for this blob.\n\n` +
				`To fix this:\n` +
				`  1. Register the blob with the container:\n` +
				`     container.register(${blobName}, ${blobName}Impl);\n\n` +
				`  2. If using parent containers, ensure the blob is registered in a parent\n` +
				`  3. Check for typos in the blob reference\n`,
		);
		this.name = 'BlobNotRegisteredError';
	}
}

/**
 * Error thrown when getBlobId() is called on an object that is not a valid blob.
 */
export class InvalidBlobError extends DiblobError {
	constructor(public readonly receivedType: string) {
		super(
			`Invalid blob: the object is not a valid diblob proxy.\n\n` +
				`Received type: ${receivedType}\n\n` +
				`A valid blob must be created using createBlob() or createListBlob().\n\n` +
				`Example:\n` +
				`  const myBlob = createBlob<MyInterface>('myBlob');\n`,
		);
		this.name = 'InvalidBlobError';
	}
}

/**
 * Error thrown when attempting to set a property on an async blob that hasn't been awaited.
 */
export class BlobAsyncSetError extends DiblobError {
	constructor(public readonly blobName: string) {
		super(
			`Cannot set property on async blob "${blobName}".\n\n` +
				`The blob is still resolving asynchronously. You must await it first.\n\n` +
				`Example:\n` +
				`  const instance = await container.resolve(${blobName});\n` +
				`  instance.property = value;\n`,
		);
		this.name = 'BlobAsyncSetError';
	}
}

/**
 * Error thrown when an invalid factory is passed to container.register().
 */
export class InvalidFactoryError extends DiblobError {
	constructor(
		public readonly blobName: string,
		public readonly receivedType: string,
	) {
		super(
			`Invalid factory for blob "${blobName}".\n\n` +
				`Expected a constructor or factory function, but received: ${receivedType}\n\n` +
				`Valid factories:\n` +
				`  - Constructor: container.register(blob, MyClass)\n` +
				`  - Factory function: container.register(blob, () => new MyClass())\n` +
				`  - Async factory: container.register(blob, async () => await createInstance())\n`,
		);
		this.name = 'InvalidFactoryError';
	}
}

/**
 * Error thrown when a list blob is mutated before being registered with a container.
 */
export class ListBlobNotRegisteredError extends DiblobError {
	constructor(public readonly blobName: string) {
		super(
			`List blob "${blobName}" must be registered with a container before mutations.\n\n` +
				`Array mutations (push, pop, splice, etc.) require the blob to be registered.\n\n` +
				`To fix this:\n` +
				`  container.register(${blobName}, () => []);\n\n` +
				`Then you can mutate:\n` +
				`  ${blobName}.push('item');\n`,
		);
		this.name = 'ListBlobNotRegisteredError';
	}
}

/**
 * Error thrown when a blob is accessed during constructor execution but the blob
 * is not yet resolved (async dependency).
 *
 * This is an internal error used by the container to handle async resolution.
 */
export class BlobNotReadyError extends DiblobError {
	constructor(public readonly promise: Promise<unknown>) {
		super('Blob not yet resolved - async dependency detected during constructor execution');
		this.name = 'BlobNotReadyError';
	}
}

