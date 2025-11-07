/**
 * Test runner - runs all test files
 */

import { run } from 'node:test';
import { spec as specReporter } from 'node:test/reporters';
import { glob } from 'node:fs/promises';

async function runTests() {
  const testFiles = [
    './test/blob.test.ts',
    './test/container-basic.test.ts',
    './test/container-lifecycle.test.ts',
    './test/container-reactive.test.ts',
    './test/container-async.test.ts',
    './test/container-nesting.test.ts',
    './test/constructor-resolution.test.ts',
    './test/edge-cases.test.ts',
    './test/integration.test.ts',
  ];

  const stream = run({
    files: testFiles,
    concurrency: true,
  });

  stream.compose(specReporter).pipe(process.stdout);
}

runTests().catch(console.error);

