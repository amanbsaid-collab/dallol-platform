import { db } from '@/lib/db';

const LEASE_MS = 60_000;

export async function claimNextJob(workerId: string) {
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + LEASE_MS);
  return db.$transaction(async (tx) => {
    const candidate = await tx.job.findFirst({
      where: { OR: [{ status: 'QUEUED', availableAt: { lte: now } }, { status: 'FAILED', availableAt: { lte: now } }, { status: 'RUNNING', leaseUntil: { lt: now } }] },
      orderBy: { createdAt: 'asc' },
    });
    if (!candidate) return null;
    const claimed = await tx.job.updateMany({
      where: { id: candidate.id, OR: [{ status: 'QUEUED', availableAt: { lte: now } }, { status: 'FAILED', availableAt: { lte: now } }, { status: 'RUNNING', leaseUntil: { lt: now } }] },
      data: { status: 'RUNNING', leasedBy: workerId, leaseUntil, attempts: { increment: 1 } },
    });
    if (claimed.count !== 1) return null;
    return tx.job.findUnique({ where: { id: candidate.id } });
  });
}
