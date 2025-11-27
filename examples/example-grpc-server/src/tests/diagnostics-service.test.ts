import assert from 'node:assert/strict';
import { test } from 'node:test';

import { type Client, createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-node';
import { createContainer } from '@speajus/diblob';
import { grpcServer, registerGrpcBlobs } from '@speajus/diblob-connect';
import { diagnosticsRecorder } from '@speajus/diblob-diagnostics';
import {
  exampleGrpcServerConfig,
  registerExampleGrpcServerConfig,
} from '../config.js';
import { DiagnosticsService } from '../generated/diagnostics_pb.js';
import {
	registerDiagnosticsService,
	registerDrizzleBlobs,
	registerUserService,
} from '../register.js';

test('DiagnosticsService returns a snapshot with at least one blob', async (_t) => {
  const container = createContainer();

  registerExampleGrpcServerConfig(container);

  const config = await container.resolve(exampleGrpcServerConfig);

	  registerDrizzleBlobs(container, ':memory:');
	  registerGrpcBlobs(container, { host: config.host, port: config.port });

	  await registerUserService(container);
	  await registerDiagnosticsService(container);

		// Start gRPC server after services are registered
		const _server = await container.resolve(grpcServer);

  // Seed one diagnostics event manually via recorder
  const recorder = await container.resolve(diagnosticsRecorder);
  recorder.record({
    blobName: 'testBlob',
    message: 'diagnostics smoke event',
    level: 'info',
    timestamp: Date.now(),
  });

  const transport = createConnectTransport({
    baseUrl: `http://${config.host}:${config.port}`,
    httpVersion: '1.1',
  });

  const client: Client<typeof DiagnosticsService> = createClient(
    DiagnosticsService,
    transport,
  );

  const response = await client.getDiagnosticsSnapshot({
    windowSeconds: 300,
    maxBlobs: 10,
    severityThreshold: 'info',
  });

  assert.ok(
    response.blobs.length > 0,
    'snapshot should include at least one blob summary',
  );

  await container.dispose();
});
