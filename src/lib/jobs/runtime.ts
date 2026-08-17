import { db } from '@/lib/db';

const LEASE_MS = 60_000;
const MAX_ATTEMPTS = 5;

export async function enqueueJob(input: { organizationId: string; type: string; payload: unknown; idempotencyKey: string }) {
  const existing = await db.job.findUnique({ where: { organizationId_idempotencyKey: { organizationId: input.organizationId, idempotencyKey: input.idempotencyKey } } });
  if (existing) return existing;
  return db.job.create({ data: { organizationId: input.organizationId, type: input.type, payload: input.payload as object, idempotencyKey: input.idempotencyKey } });
}

export async function claimNextJob(workerId: string) {
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + LEASE_MS);
  return db.$transaction(async (tx) => {
    const candidate = await tx.job.findFirst({
      where: { OR: [{ status: 'QUEUED', availableAt: { lte: now } }, { status: 'FAILED', availableAt: { lte: now } }, { status: 'RUNNING', leaseUntil: { lt: now } }] },
      orderBy: { createdAt: 'asc' },
    });
    if (!candidate) return null;
    return tx.job.update({ where: { id: candidate.id }, data: { status: 'RUNNING', leasedBy: workerId, leaseUntil, attempts: { increment: 1 } } });
  });
}

export async function completeJob(jobId: string, output: unknown) {
  return db.job.update({ where: { id: jobId }, data: { status: 'SUCCEEDED', result: output as object, leaseUntil: null, leasedBy: null, completedAt: new Date() } });
}

export async function failJob(jobId: string, error: string) {
  const job = await db.job.findUniqueOrThrow({ where: { id: jobId } });
  const terminal = job.attempts >= Math.min(job.maxAttempts, MAX_ATTEMPTS);
  const delayMs = Math.min(60_000 * 2 ** Math.max(job.attempts - 1, 0), 3_600_000);
  return db.job.update({ where: { id: jobId }, data: { status: terminal ? 'DEAD_LETTER' : 'FAILED', lastError: error, availableAt: new Date(Date.now() + delayMs), leaseUntil: null, leasedBy: null } });
}

export async function getJob(jobId: string, organizationId: string) {
  return db.job.findFirst({ where: { id: jobId, organizationId } });
}
