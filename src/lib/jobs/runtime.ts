import { db } from '@/lib/db';

export type JobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'DEAD_LETTER';

export async function enqueueJob(input: { organizationId: string; type: string; payload: unknown; idempotencyKey: string }) {
  return db.auditEvent.create({ data: { organizationId: input.organizationId, action: 'job.enqueued', entityType: 'Job', metadata: { type: input.type, payload: input.payload, idempotencyKey: input.idempotencyKey, status: 'QUEUED' } } });
}

export async function claimJob(input: { organizationId: string; jobId: string }) {
  return db.auditEvent.create({ data: { organizationId: input.organizationId, action: 'job.claimed', entityType: 'Job', entityId: input.jobId, metadata: { status: 'RUNNING', claimedAt: new Date().toISOString() } } });
}

export async function completeJob(input: { organizationId: string; jobId: string; output: unknown }) {
  return db.auditEvent.create({ data: { organizationId: input.organizationId, action: 'job.completed', entityType: 'Job', entityId: input.jobId, metadata: { status: 'SUCCEEDED', output: input.output } } });
}

export async function failJob(input: { organizationId: string; jobId: string; error: string; attempts: number; maxAttempts?: number }) {
  const maxAttempts = input.maxAttempts ?? 5;
  const status: JobStatus = input.attempts >= maxAttempts ? 'DEAD_LETTER' : 'FAILED';
  return db.auditEvent.create({ data: { organizationId: input.organizationId, action: status === 'DEAD_LETTER' ? 'job.dead_lettered' : 'job.failed', entityType: 'Job', entityId: input.jobId, metadata: { status, error: input.error, attempts: input.attempts, maxAttempts } } });
}
