import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  attachContainerDisposal,
  DIBLOB_CONTAINER_CONTEXT_KEY,
  provideContainerContext,
  useBlob,
  useContainer,
} from '../src/context.js';

// Basic smoke test to ensure the Svelte helpers are present and shaped as expected.
//
// We intentionally do not exercise Svelte runtime behavior here; the goal is
// simply to verify that the module loads correctly in a Node test environment
// and that key helpers are exported.

test('diblob-svelte context helpers export expected shapes', () => {
  assert.equal(typeof DIBLOB_CONTAINER_CONTEXT_KEY, 'symbol');
  assert.equal(typeof provideContainerContext, 'function');
  assert.equal(typeof useContainer, 'function');
  assert.equal(typeof useBlob, 'function');
  assert.equal(typeof attachContainerDisposal, 'function');
});

