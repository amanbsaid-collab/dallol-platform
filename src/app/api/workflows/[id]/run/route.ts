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
  const idempotencyKey = request.headers.get('idempotency-key')?.trim();

  if (idempotencyKey) {
    const existingJob = await db.job.findUnique({
      where: { organizationId_idempotencyKey: { organizationId: membership.organizationId, idempotencyKey } },
    });
    if (existingJob) {
      const payload = existingJob.payload && typeof existingJob.payload === 'object'
        ? existingJob.payload as { workflowId?: string; runId?: string }
        : {};
      if (payload.workflowId !== workflow.id) return NextResponse.json({ error: 'Idempotency key already belongs to another workflow' }, { status: 409 });
      const run = payload.runId ? await db.workflowRun.findUnique({ where: { id: payload.runId } }) : null;
      return NextResponse.json({ run, job: existingJob, replayed: true }, { status: 202 });
    }
  }

  const result = await db.$transaction(async (tx) => {
    const run = await tx.workflowRun.create({
      data: { workflowId: workflow.id, status: 'QUEUED', input: body },
    });
    const job = await tx.job.create({
      data: {
        organizationId: membership.organizationId,
        type: 'workflow.execute',
        payload: { workflowId: workflow.id, runId: run.id, input: body },
        idempotencyKey: idempotencyKey || `workflow-run:${run.id}`,
      },
    });
    return { run, job };
  });

  await writeAuditEvent({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: 'queued',
    entityType: 'workflow_run',
    entityId: result.run.id,
    metadata: { workflowId: workflow.id, jobId: result.job.id },
  });

  return NextResponse.json(result, { status: 202 });
}
