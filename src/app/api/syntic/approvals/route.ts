import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { createApprovalRequest } from '@/lib/syntic/approval';
import { requireOrganizationMembership } from '@/lib/tenant';

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const membership = await requireOrganizationMembership();
    const body = await request.json();
    if (typeof body.task !== 'string' || !body.proposedMutation) {
      return NextResponse.json({ error: 'task_and_proposedMutation_required' }, { status: 400 });
    }
    const approval = await createApprovalRequest({
      organizationId: membership.organizationId,
      userId: session.user.id,
      task: body.task,
      proposedMutation: body.proposedMutation,
    });
    return NextResponse.json({ id: approval.id, status: 'PENDING' }, { status: 202 });
  } catch {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
}
