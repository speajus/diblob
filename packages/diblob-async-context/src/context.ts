import { AsyncLocalStorage } from 'node:async_hooks';
import type { Blob, Container } from '@speajus/diblob';
import { Lifecycle } from '@speajus/diblob';

const CONTEXT_OUTSIDE_SCOPE_ERROR =
	  'Async context blob accessed outside of an active async context. ' +
	  'Ensure AsyncLocalStorageContext.runWithContext is used to wrap request handling.';

/**
	 * AsyncLocalStorage-backed context manager for an arbitrary context object.
	 *
	 * The generic parameter TContext defaults to a plain object for convenience,
	 * but it can be any object shape. Property access on the registered blob
	 * proxy resolves against the current AsyncLocalStorage store.
	 */
export class AsyncLocalStorageContext<TContext extends object = object> {
	  private readonly storage = new AsyncLocalStorage<TContext>();

	  // Proxy instance that forwards property access to the current AsyncLocalStorage store.
	  private readonly contextProxy: TContext;

	  constructor(private readonly container: Container) {
	    this.contextProxy = new Proxy({} as TContext, {
	      get: (_target, prop) => {
	        if (prop === Symbol.toStringTag) {
	          return 'AsyncContextProxy';
	        }

	        const store = this.storage.getStore();
	        if (!store) {
	          throw new Error(CONTEXT_OUTSIDE_SCOPE_ERROR);
	        }

	        // biome-ignore lint/suspicious/noExplicitAny: context is an open object bag.
	        const value = (store as any)[prop];
	        if (typeof value === 'function') {
	          return value.bind(store);
	        }
	        return value;
	      },
	      set: (_target, prop, value) => {
	        const store = this.storage.getStore();
	        if (!store) {
	          throw new Error(CONTEXT_OUTSIDE_SCOPE_ERROR);
	        }

	        // biome-ignore lint/suspicious/noExplicitAny: context is an open object bag.
	        (store as any)[prop] = value;
	        return true;
	      },
	    });
	  }

	  /**
	   * Run the given handler within the scope of the provided context object.
	   *
	   * All async work that is transitively awaited from the handler will see this
	   * context when accessing the associated blob.
	   */
	  runWithContext<TResult>(
	    context: TContext,
	    handler: () => Promise<TResult> | TResult,
	  ): Promise<TResult> | TResult {
	    return this.storage.run(context, handler);
	  }

	  /**
	   * Associate a context blob with this AsyncLocalStorageContext.
	   *
	   * The blob will resolve to a proxy object whose properties always reflect the
	   * current AsyncLocalStorage store, failing fast if accessed outside an active
	   * context.
	   */
	  registerWithContext(blob: Blob<TContext>): void {
	    this.container.register(
	      blob,
	      () => this.contextProxy,
	      { lifecycle: Lifecycle.Singleton },
	    );
	  }
	}

