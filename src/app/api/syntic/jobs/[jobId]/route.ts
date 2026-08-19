import { db } from '@/lib/db';
import { requireOrganizationMembership } from '@/lib/tenant';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    const membership = await requireOrganizationMembership();
    const { jobId } = await context.params;

    const job = await db.job.findFirst({
      where: {
        id: jobId,
        organizationId: membership.organizationId,
      },
      select: {
        id: true,
        type: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        availableAt: true,
        leaseUntil: true,
        lastError: true,
        result: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'JOB_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, job });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JOB_STATUS_FAILED';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
