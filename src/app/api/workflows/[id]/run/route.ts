import { NextResponse } from 'next/server';
import { getCurrentMembership } from '@/lib/tenant';
import { db } from '@/lib/db';
import { writeAuditEvent } from '@/lib/audit';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentMembership();
  if (!membership) return NextResponse.json({ error: 'Organization membership required' }, { status: 403 });

  const { id } = await context.params;
  const workflow = await db.workflow.findFirst({
    where: { id, organizationId: membership.organizationId },
  });
  if (!workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  if (workflow.status !== 'ACTIVE') return NextResponse.json({ error: 'Workflow must be ACTIVE' }, { status: 409 });

  const body = await request.json().catch(() => ({}));
  const run = await db.workflowRun.create({
    data: { workflowId: workflow.id, status: 'QUEUED', input: body },
  });

  await writeAuditEvent({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: 'queued',
    entityType: 'workflow_run',
    entityId: run.id,
    metadata: { workflowId: workflow.id },
  });

  return NextResponse.json({ run }, { status: 202 });
}
