import assert from 'node:assert/strict';
import test from 'node:test';

import { createContainer } from '@speajus/diblob';
import { registerTelemetryLoggerBlobs } from '@speajus/diblob-telemetry';
import { processExampleJob, registerWorkerBlobs } from './register.js';
import { registerWorkerConfig, workerConfig } from './workerConfig.js';

test('worker container can be created and a job can be processed', async () => {
	const container = createContainer();
		registerWorkerConfig(container);

		// Configure logger in the same way as the real worker entrypoint so that
		// the processExampleJob blob can depend on the logger blob.
		const config = await container.resolve(workerConfig);
		registerTelemetryLoggerBlobs(container, {
			level: config.logLevel,
			prettyPrint: config.logPretty,
			defaultMeta: { service: 'example-worker-tasks' },
		});

		await registerWorkerBlobs(container);

	const handler = await container.resolve(processExampleJob);
  await assert.doesNotReject(async () => {
    await handler();
  });

  await container.dispose();
});

