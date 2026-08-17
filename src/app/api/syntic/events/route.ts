import { NextResponse } from 'next/server';
import { requireOrganizationMembership } from '@/lib/tenant';
import { emitSynticEvent } from '@/lib/syntic/events';

export async function POST(request: Request) {
  try {
    const membership = await requireOrganizationMembership();
    const body = await request.json();
    if (typeof body.type !== 'string') return NextResponse.json({ error: 'event_type_required' }, { status: 400 });
    const result = await emitSynticEvent({ organizationId: membership.organizationId, type: body.type, payload: body.payload ?? {} });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'EVENT_DISPATCH_FAILED' }, { status: 400 });
  }
}
