import { NextResponse } from 'next/server';
import { requireOrganizationMembership } from '@/lib/tenant';
import { runSynticAgent } from '@/lib/syntic/intelligence';

export async function POST(request: Request) {
  try {
    const membership = await requireOrganizationMembership();
    const body = await request.json();
    if (typeof body.task !== 'string' || !body.task.trim()) {
      return NextResponse.json({ error: 'TASK_REQUIRED' }, { status: 400 });
    }

    const result = await runSynticAgent({
      organizationId: membership.organizationId,
      userId: membership.userId,
      task: body.task,
      context: body.context && typeof body.context === 'object' ? body.context : {},
      autoApprove: body.autoApprove === true && membership.role !== 'MEMBER',
    });

    return NextResponse.json(result, { status: result.approvalRequired ? 202 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SYNTIC_EXECUTION_FAILED';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
