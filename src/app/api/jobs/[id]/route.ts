import { NextResponse } from 'next/server';
import { requireOrganizationMembership } from '@/lib/tenant';
import { getJob } from '@/lib/jobs/runtime';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const membership = await requireOrganizationMembership();
    const { id } = await context.params;
    const job = await getJob(id, membership.organizationId);
    if (!job) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json({
      id: job.id,
      type: job.type,
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      availableAt: job.availableAt,
      leaseUntil: job.leaseUntil,
      result: job.result,
      lastError: job.lastError,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
}
