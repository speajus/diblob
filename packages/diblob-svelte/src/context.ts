import type { Blob, Container } from '@speajus/diblob';
import { getContext, onDestroy, setContext } from 'svelte';

/**
 * Context key used to store a diblob Container in the Svelte component tree.
 */
export const DIBLOB_CONTAINER_CONTEXT_KEY = Symbol.for(
  '@speajus/diblob-svelte/container',
);

/**
 * Provide a diblob container to the Svelte component tree.
 *
 * Call this in a top-level component (for example, App.svelte) to make the
 * container available to all descendants via useContainer and useBlob.
 */
export function provideContainerContext(container: Container): void {
  setContext(DIBLOB_CONTAINER_CONTEXT_KEY, container);
}

/**
 * Retrieve the current diblob container from Svelte context.
 *
 * This helper must be called from within component initialization code.
 */
export function useContainer(): Container {
  const container = getContext<Container | undefined>(
    DIBLOB_CONTAINER_CONTEXT_KEY,
  );

  if (!container) {
    throw new Error(
      'No diblob container found in Svelte context. ' +
        'Call provideContainerContext() in a parent component or wrap your tree in a container provider.',
    );
  }

  return container;
}

/**
 * Resolve a blob from the current Svelte-context container.
 *
 * The resolved value can be synchronous or asynchronous, depending on how the
 * blob was registered.
 */
export function useBlob<T>(blob: Blob<T>): T | Promise<T> {
  const container = useContainer();
  return container.resolve(blob);
}

/**
 * Attach lifecycle management so that the container is disposed when the
 * current component is destroyed.
 *
 * This is useful when the container lifetime should match the Svelte
 * application or a portion of the component tree.
 */
export function attachContainerDisposal(container: Container): void {
  onDestroy(() => {
    const disposeResult = container.dispose();
    if (disposeResult instanceof Promise) {
      void disposeResult.catch(() => {
        // Swallow errors during disposal; examples should not crash on shutdown.
      });
    }
  });
}

