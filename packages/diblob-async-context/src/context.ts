import { AsyncResource, createHook, executionAsyncId } from 'node:async_hooks';
import type { Blob, Container } from '@speajus/diblob';
import { Lifecycle } from '@speajus/diblob';

const CONTEXT_OUTSIDE_SCOPE_ERROR =
	'Async context blob accessed outside of an active async context. ' +
	'Ensure AsyncLocalStorageContext.runWithContext is used to wrap request handling.';

const CONTEXT_NOT_INITIALIZED_ERROR =
	'Async context blob accessed before it was initialized in this async scope. ' +
	'Ensure AsyncLocalStorageContext.runWithContext is used to provide a value for this blob.';

	type ContextStore = Map<Blob<unknown>, object>;

	interface StoreEntry {
		rootId: number;
		store: ContextStore;
	}

	// Map each async execution context to its associated context store, and
	// track all async IDs that participate in a given root context so we can
	// reliably clear the entire tree when the scope ends.
	const contextEntries = new Map<number, StoreEntry>();
	const rootChildren = new Map<number, Set<number>>();

	function attachStore(asyncId: number, entry: StoreEntry): void {
		contextEntries.set(asyncId, entry);
		let ids = rootChildren.get(entry.rootId);
		if (!ids) {
			ids = new Set<number>();
			rootChildren.set(entry.rootId, ids);
		}
		ids.add(asyncId);
	}

	function clearRoot(rootId: number): void {
		const ids = rootChildren.get(rootId);
		if (!ids) return;
		for (const id of ids) {
			contextEntries.delete(id);
		}
		rootChildren.delete(rootId);
	}

	createHook({
		init(asyncId, _type, triggerAsyncId) {
			const parentEntry = contextEntries.get(triggerAsyncId);
			if (parentEntry) {
				attachStore(asyncId, parentEntry);
			}
		},
		destroy(asyncId) {
			const entry = contextEntries.get(asyncId);
			if (!entry) return;
			contextEntries.delete(asyncId);
			const ids = rootChildren.get(entry.rootId);
			if (!ids) return;
			ids.delete(asyncId);
			if (ids.size === 0) {
				rootChildren.delete(entry.rootId);
			}
		},
	}).enable();

	function getCurrentStore(): ContextStore | undefined {
		const entry = contextEntries.get(executionAsyncId());
		return entry?.store;
	}

/**
 * AsyncLocalStorage-backed context manager for blob-scoped context values.
 *
 * Each registered blob resolves to a proxy whose properties always reflect the
 * current value for that blob in the AsyncLocalStorage store. The value is set
 * per async scope via `runWithContext(blob, value, handler)`.
 */
export class AsyncLocalStorageContext {
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

					const store = getCurrentStore();
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
					const store = getCurrentStore();
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
			const parentStore = getCurrentStore();
			if (!parentStore) {
				// No active async context for this container yet: create a new root
				// async context that will be propagated to all child async work.
				const nextStore = new Map<Blob<unknown>, object>();
				nextStore.set(blob as Blob<unknown>, value);

				const resource = new AsyncResource(
					'diblob.AsyncLocalStorageContext.runWithContext',
				);
				const asyncId = resource.asyncId();
				const entry: StoreEntry = { rootId: asyncId, store: nextStore };
				attachStore(asyncId, entry);

				const runHandler = () => handler();
				const cleanup = () => {
					clearRoot(asyncId);
					resource.emitDestroy();
				};

				try {
					const result = resource.runInAsyncScope(runHandler) as
							| Promise<TResult>
							| TResult;
					if (
						result &&
						typeof (result as Promise<TResult>).then === 'function'
					) {
						return (result as Promise<TResult>).finally(() => {
							cleanup();
						});
					}

					cleanup();
					return result;
				} catch (error) {
					cleanup();
					throw error;
				}
			}

			// Nested within an existing async context: temporarily override the
			// value for this blob within the current store and restore it when the
			// handler completes.
			const previous = parentStore.get(blob as Blob<unknown>);
			parentStore.set(blob as Blob<unknown>, value);

			const runHandler = () => handler();
			const restore = () => {
				if (previous === undefined) {
					parentStore.delete(blob as Blob<unknown>);
				} else {
					parentStore.set(blob as Blob<unknown>, previous);
				}
			};

			try {
				const result = runHandler() as Promise<TResult> | TResult;
				if (result && typeof (result as Promise<TResult>).then === 'function') {
					return (result as Promise<TResult>).finally(() => {
						restore();
					});
				}

				restore();
				return result;
			} catch (error) {
				restore();
				throw error;
			}
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

