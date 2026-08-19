import { NextResponse } from 'next/server';
import { requireOrganizationMembership } from '@/lib/tenant';
import { dispatchScheduledWorkflows } from '@/lib/syntic/scheduler';

export async function POST() {
  try {
    await requireOrganizationMembership();
    return NextResponse.json(await dispatchScheduledWorkflows());
  } catch {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
}
