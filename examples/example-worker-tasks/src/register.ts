import type { Container } from '@speajus/diblob';
import { createBlob } from '@speajus/diblob';
import type { Logger } from '@speajus/diblob-logger';
import { logger } from '@speajus/diblob-logger';
import type { WorkerConfig } from './workerConfig';
import { workerConfig } from './workerConfig';

export type ProcessExampleJob = () => Promise<void>;

export const processExampleJob = createBlob<ProcessExampleJob>('processExampleJob');

export async function registerWorkerBlobs(container: Container): Promise<void> {
	container.register(
		processExampleJob,
		(config: WorkerConfig, workerLogger: Logger): ProcessExampleJob => {
			return async () => {
				workerLogger.info('Processing example worker task', {
					time: new Date().toISOString(),
					deploymentEnvironment: config.deploymentEnvironment,
				});
			};
		},
		workerConfig,
		logger,
	);
}

