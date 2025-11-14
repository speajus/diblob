/**
 * Svelte integration helpers for diblob containers.
 */

export type { Blob, Container } from '@speajus/diblob';

export {
  DIBLOB_CONTAINER_CONTEXT_KEY,
  provideContainerContext,
  useContainer,
  useBlob,
  attachContainerDisposal,
} from './context.js';

