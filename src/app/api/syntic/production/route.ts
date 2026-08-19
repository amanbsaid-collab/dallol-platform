import { NextResponse } from 'next/server';
import { requireOrganizationMembership } from '@/lib/tenant';
import { enqueueProductionWorkflow } from '@/lib/syntic/production-agent';

export async function POST(request: Request) {
  try {
    const membership = await requireOrganizationMembership();
    const body = await request.json();

    if (typeof body.workflowId !== 'string' || typeof body.idempotencyKey !== 'string') {
      return NextResponse.json({ error: 'workflowId_and_idempotencyKey_required' }, { status: 400 });
    }

    const input = body.input && typeof body.input === 'object' ? body.input : {};
    const job = await enqueueProductionWorkflow({
      organizationId: membership.organizationId,
      userId: membership.userId,
      workflowId: body.workflowId,
      input,
      idempotencyKey: body.idempotencyKey,
      autoApprove: body.autoApprove === true && membership.role !== 'MEMBER',
    });

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      status: job.status,
      type: job.type,
    }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PRODUCTION_WORKFLOW_ENQUEUE_FAILED';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
