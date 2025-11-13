import { glob } from 'node:fs/promises';
import { run } from 'node:test';
import { spec as specReporter } from 'node:test/reporters';

async function runTests() {
  // Find all test files
  const testFiles: string[] = [];

  for await (const file of glob('test/**/*.test.ts', {
    cwd: process.cwd(),
  })) {
    testFiles.push(file);
  }

  if (testFiles.length === 0) {
    console.error('No test files found');
    process.exit(1);
  }

  console.log(`Found ${testFiles.length} test file(s)\n`);

  // Run tests with spec reporter
  const stream = run({
    files: testFiles,
    concurrency: true, // Run tests in parallel
    timeout: 30000,    // 30 second timeout per test
  });

  // Pipe the test stream through the spec reporter to stdout
  stream.compose(specReporter).pipe(process.stdout);
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});