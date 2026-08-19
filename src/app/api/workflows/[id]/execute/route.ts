import { NextResponse } from 'next/server';
import { requireOrganizationMembership } from '@/lib/tenant';
import { executeWorkflow } from '@/lib/workflows/engine';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const membership = await requireOrganizationMembership();
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const workflow = await executeWorkflow(id, body);

    return NextResponse.json({ ...workflow, organizationId: membership.organizationId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'WORKFLOW_EXECUTION_FAILED';
    const status = message === 'WORKFLOW_NOT_FOUND' ? 404 : message === 'WORKFLOW_NOT_ACTIVE' ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
