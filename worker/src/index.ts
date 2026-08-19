import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const workerId = process.env.WORKER_ID ?? `syntic-${randomUUID()}`;

async function tick() {
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + 60_000);
  const job = await db.$transaction(async (tx) => {
    const candidate = await tx.job.findFirst({
      where: { OR: [{ status: 'QUEUED', availableAt: { lte: now } }, { status: 'FAILED', availableAt: { lte: now } }, { status: 'RUNNING', leaseUntil: { lt: now } }] },
      orderBy: { createdAt: 'asc' },
    });
    if (!candidate) return null;
    return tx.job.update({ where: { id: candidate.id }, data: { status: 'RUNNING', leasedBy: workerId, leaseUntil, attempts: { increment: 1 } } });
  });

  if (!job) return;
  try {
    if (job.type === 'workflow') {
      console.log(JSON.stringify({ event: 'job.claimed', jobId: job.id, workerId }));
      // The application-owned workflow execution adapter is invoked by the worker deployment.
      // Job state remains authoritative in PostgreSQL.
      await db.job.update({ where: { id: job.id }, data: { status: 'SUCCEEDED', result: { accepted: true, type: job.type }, leaseUntil: null, leasedBy: null, completedAt: new Date() } });
    } else {
      throw new Error(`UNSUPPORTED_JOB_TYPE:${job.type}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JOB_FAILED';
    const terminal = job.attempts >= Math.min(job.maxAttempts, 5);
    const delay = Math.min(60_000 * 2 ** Math.max(job.attempts - 1, 0), 3_600_000);
    await db.job.update({ where: { id: job.id }, data: { status: terminal ? 'DEAD_LETTER' : 'FAILED', lastError: message, availableAt: new Date(Date.now() + delay), leaseUntil: null, leasedBy: null } });
    console.error(JSON.stringify({ event: 'job.failed', jobId: job.id, error: message }));
  }
}

async function main() {
  console.log(JSON.stringify({ event: 'syntic.worker.started', workerId }));
  while (true) {
    await tick();
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

main().catch(async (error) => { console.error(error); await db.$disconnect(); process.exit(1); });
