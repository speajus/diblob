import { AsyncLocalStorage } from 'node:async_hooks';
import type { Blob, Container } from '@speajus/diblob';
import { Lifecycle } from '@speajus/diblob';

const CONTEXT_OUTSIDE_SCOPE_ERROR =
	'Async context blob accessed outside of an active async context. ' +
	'Ensure AsyncLocalStorageContext.runWithContext is used to wrap request handling.';

const CONTEXT_NOT_INITIALIZED_ERROR =
	'Async context blob accessed before it was initialized in this async scope. ' +
	'Ensure AsyncLocalStorageContext.runWithContext is used to provide a value for this blob.';

/**
 * AsyncLocalStorage-backed context manager for blob-scoped context values.
 *
 * Each registered blob resolves to a proxy whose properties always reflect the
 * current value for that blob in the AsyncLocalStorage store. The value is set
 * per async scope via `runWithContext(blob, value, handler)`.
 */
export class AsyncLocalStorageContext {
	private readonly storage = new AsyncLocalStorage<Map<Blob<unknown>, object>>();

	// Track which blobs have already been wired to this async context.
	private readonly registeredBlobs = new Set<Blob<unknown>>();

	constructor(private readonly container: Container) {}

	/**
	 * Lazily associate a context blob with this AsyncLocalStorageContext.
	 *
	 * The blob will resolve to a proxy object whose properties always reflect the
	 * current AsyncLocalStorage store, failing fast if accessed outside an active
	 * context or before a value has been provided for that blob.
	 */
	private registerBlob<TContext extends object>(blob: Blob<TContext>): void {
		if (this.registeredBlobs.has(blob as Blob<unknown>)) return;
		this.registeredBlobs.add(blob as Blob<unknown>);

		const proxy = new Proxy({} as TContext, {
			get: (_target, prop) => {
				if (prop === Symbol.toStringTag) {
					return 'AsyncContextProxy';
				}

				const store = this.storage.getStore();
				if (!store) {
					throw new Error(CONTEXT_OUTSIDE_SCOPE_ERROR);
				}

				const value = store.get(blob as Blob<unknown>) as TContext | undefined;
				if (!value) {
					throw new Error(CONTEXT_NOT_INITIALIZED_ERROR);
				}

				// biome-ignore lint/suspicious/noExplicitAny: context is an open object bag.
				const result = (value as any)[prop];
				if (typeof result === 'function') {
					return result.bind(value);
				}
				return result;
			},
			set: (_target, prop, newValue) => {
				const store = this.storage.getStore();
				if (!store) {
					throw new Error(CONTEXT_OUTSIDE_SCOPE_ERROR);
				}

				const value = store.get(blob as Blob<unknown>) as TContext | undefined;
				if (!value) {
					throw new Error(CONTEXT_NOT_INITIALIZED_ERROR);
				}

				// biome-ignore lint/suspicious/noExplicitAny: context is an open object bag.
				(value as any)[prop] = newValue;
				return true;
			},
		});

		this.container.register(blob, () => proxy, {
			lifecycle: Lifecycle.Singleton,
		});
	}

	/**
	 * Run the given handler within the scope of the provided value for the blob.
	 *
	 * All async work that is transitively awaited from the handler will see this
	 * value when accessing the associated blob.
	 */
		runWithContext<TContext extends object, TResult>(
			blob: Blob<TContext>,
			value: TContext,
			handler: () => Promise<TResult> | TResult,
		): Promise<TResult> | TResult {
			this.registerBlob(blob);
			const parentStore = this.storage.getStore();
			const nextStore = parentStore
				? new Map<Blob<unknown>, object>(parentStore)
				: new Map<Blob<unknown>, object>();
			nextStore.set(blob as Blob<unknown>, value);
			return this.storage.run(nextStore, handler);
		}

	/**
	 * Explicitly associate a context blob with this AsyncLocalStorageContext.
	 *
	 * The blob will resolve to a proxy object whose properties always reflect the
	 * current AsyncLocalStorage store, failing fast if accessed outside an active
	 * context or before a value has been provided for that blob.
	 */
	registerWithContext<TContext extends object>(blob: Blob<TContext>): void {
		this.registerBlob(blob);
	}
}

