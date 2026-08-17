import { NextResponse } from 'next/server';
import { getCurrentMembership } from '@/lib/tenant';
import { db } from '@/lib/db';
import { writeAuditEvent } from '@/lib/audit';

export async function GET() {
  const membership = await getCurrentMembership();
  if (!membership) return NextResponse.json({ error: 'Organization membership required' }, { status: 403 });

  const workflows = await db.workflow.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ workflows });
}

export async function POST(request: Request) {
  const membership = await getCurrentMembership();
  if (!membership) return NextResponse.json({ error: 'Organization membership required' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : null;
  const definition = body?.definition && typeof body.definition === 'object' ? body.definition : { steps: [] };

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const workflow = await db.workflow.create({
    data: { organizationId: membership.organizationId, name, description, definition },
  });

  await writeAuditEvent({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: 'created',
    entityType: 'workflow',
    entityId: workflow.id,
  });

  return NextResponse.json({ workflow }, { status: 201 });
}
