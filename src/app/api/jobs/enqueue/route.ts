import { NextResponse } from 'next/server';
import { requireOrganizationMembership } from '@/lib/tenant';
import { enqueueJob } from '@/lib/jobs/runtime';

export async function POST(request: Request) {
  try {
    const membership = await requireOrganizationMembership();
    const body = await request.json();
    if (typeof body.type !== 'string' || typeof body.idempotencyKey !== 'string') return NextResponse.json({ error: 'type_and_idempotencyKey_required' }, { status: 400 });
    const job = await enqueueJob({ organizationId: membership.organizationId, type: body.type, payload: body.payload ?? {}, idempotencyKey: body.idempotencyKey });
    return NextResponse.json({ id: job.id, status: 'QUEUED' }, { status: 202 });
  } catch {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
}
