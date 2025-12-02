import assert from 'node:assert/strict';
import test from 'node:test';

import { createContainer } from '@speajus/diblob';
import { processExampleJob, registerWorkerBlobs } from './register';
import { registerWorkerConfig } from './workerConfig';

test('worker container can be created and a job can be processed', async () => {
	const container = createContainer();
	registerWorkerConfig(container);
	await registerWorkerBlobs(container);

	const handler = await container.resolve(processExampleJob);
  await assert.doesNotReject(async () => {
    await handler();
  });

  await container.dispose();
});

