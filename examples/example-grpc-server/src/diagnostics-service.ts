/**
 * Diagnostics service implementation
 *
 * Exposes a Connect/Buf service that returns a diagnostics snapshot based on
 * the @speajus/diblob-diagnostics aggregator, suitable for UIs and LLMs.
 */

import { create } from '@bufbuild/protobuf';
import type { ServiceImpl } from '@connectrpc/connect';
import { type Blob, createBlob } from '@speajus/diblob';
import {
	type DiagnosticsAggregator,
	type DiagnosticsWindowConfig,
	diagnosticsAggregator,
	renderDiagnosticsSummaryText,
} from '@speajus/diblob-diagnostics';
import {
	DiagnosticsBlobSummarySchema,
	type DiagnosticsService,
	type GetDiagnosticsSnapshotRequest,
	type GetDiagnosticsSnapshotResponse,
	GetDiagnosticsSnapshotResponseSchema,
} from './generated/diagnostics_pb.js';

export class DiagnosticsServiceImpl implements ServiceImpl<typeof DiagnosticsService> {
	private readonly aggregator: DiagnosticsAggregator;

	constructor(
		aggregator: Blob<DiagnosticsAggregator> | DiagnosticsAggregator = diagnosticsAggregator,
	) {
		this.aggregator = aggregator as DiagnosticsAggregator;
	}

	async getDiagnosticsSnapshot(
		request: GetDiagnosticsSnapshotRequest,
	): Promise<GetDiagnosticsSnapshotResponse> {
		const overrides: Partial<DiagnosticsWindowConfig> = {};

		if (request.windowSeconds > 0) {
			overrides.windowSeconds = request.windowSeconds;
		}
		if (request.maxBlobs > 0) {
			overrides.maxBlobs = request.maxBlobs;
		}

		const severity = coerceSeverity(request.severityThreshold);
		if (severity) {
			overrides.severityThreshold = severity;
		}

		const snapshot = await this.aggregator.calculateSnapshot(overrides);
		const summaryText = renderDiagnosticsSummaryText(snapshot);

		return create(GetDiagnosticsSnapshotResponseSchema, {
			generatedAt: snapshot.generatedAt,
			windowSeconds: snapshot.windowSeconds,
			totalEvents: BigInt(snapshot.totalEvents),
			blobs: snapshot.blobs.map((blob) =>
				create(DiagnosticsBlobSummarySchema, {
					blobName: blob.blobName,
					health: blob.health,
					totalEvents: BigInt(blob.totalEvents),
					errorCount: BigInt(blob.errorCount),
					warnCount: BigInt(blob.warnCount),
					infoCount: BigInt(blob.infoCount),
					debugCount: BigInt(blob.debugCount),
					successCount: BigInt(blob.successCount),
					failureCount: BigInt(blob.failureCount),
					averageDurationMs: blob.averageDurationMs ?? 0,
					p95DurationMs: blob.p95DurationMs ?? 0,
					lastErrorMessage: blob.lastErrorMessage ?? '',
					lastErrorTimestamp: blob.lastErrorTimestamp ?? '',
				}),
			),
			summaryText,
		});
	}
}

function coerceSeverity(
	value: string | undefined,
): DiagnosticsWindowConfig['severityThreshold'] | undefined {
	if (!value) return undefined;
	if (value === 'debug' || value === 'info' || value === 'warn' || value === 'error') {
		return value;
	}
	return undefined;
}

export const diagnosticsService = createBlob<ServiceImpl<typeof DiagnosticsService>>(
	'diagnosticsService',
	{
		name: 'Diagnostics Service',
		description: 'Service for retrieving diagnostics snapshots',
	},
);
