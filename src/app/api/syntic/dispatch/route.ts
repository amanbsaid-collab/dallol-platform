import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireOrganizationMembership } from '@/lib/tenant';
import { db } from '@/lib/db';
import { writeAuditEvent } from '@/lib/audit';

function stableKey(organizationId: string, task: string, context: Record<string, unknown>) {
  return createHash('sha256')
    .update(JSON.stringify({ organizationId, task, context }))
    .digest('hex');
}

export async function POST(request: Request) {
  try {
    const membership = await requireOrganizationMembership();
    const body = await request.json().catch(() => null);
    const task = typeof body?.task === 'string' ? body.task.trim() : '';
    const context = body?.context && typeof body.context === 'object' && !Array.isArray(body.context)
      ? body.context as Record<string, unknown>
      : {};

    if (!task) return NextResponse.json({ error: 'TASK_REQUIRED' }, { status: 400 });

    const idempotencyKey = `syntic:${stableKey(membership.organizationId, task, context)}`;
    const payload = JSON.parse(JSON.stringify({
      input: { task, context, userId: membership.userId },
    }));
    const job = await db.job.upsert({
      where: { organizationId_idempotencyKey: { organizationId: membership.organizationId, idempotencyKey } },
      create: {
        organizationId: membership.organizationId,
        type: 'syntic.workflow.execute',
        payload,
        idempotencyKey,
      },
      update: {},
    });

    await writeAuditEvent({
      organizationId: membership.organizationId,
      userId: membership.userId,
      action: 'syntic.dispatched',
      entityType: 'Job',
      entityId: job.id,
      metadata: { task, idempotencyKey },
    });

    return NextResponse.json({ jobId: job.id, status: job.status, idempotencyKey }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SYNTIC_DISPATCH_FAILED';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
