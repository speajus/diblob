/**
 * Svelte integration helpers for diblob containers.
 */

export type { Blob, Container } from '@speajus/diblob';
export {
  attachContainerDisposal,
  DIBLOB_CONTAINER_CONTEXT_KEY,
  provideContainerContext,
  useBlob,
  useContainer,
} from './context.js';

