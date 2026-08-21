import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentMembership } from '@/lib/tenant';
import { writeAuditEvent } from '@/lib/audit';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const membership = await getCurrentMembership();
  if (!membership) return NextResponse.json({ error: 'Organization membership required' }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  const deal = await db.deal.findFirst({ where: { id, contact: { organizationId: membership.organizationId } } });
  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

  const data: { stageId?: string; status?: 'OPEN' | 'WON' | 'LOST'; name?: string; valueCents?: number } = {};
  if (typeof body?.stageId === 'string') {
    const stage = await db.pipelineStage.findFirst({ where: { id: body.stageId, pipelineId: deal.pipelineId } });
    if (!stage) return NextResponse.json({ error: 'Stage does not belong to this pipeline' }, { status: 400 });
    data.stageId = stage.id;
  }
  if (body?.status === 'OPEN' || body?.status === 'WON' || body?.status === 'LOST') data.status = body.status;
  if (typeof body?.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (Number.isInteger(body?.valueCents) && body.valueCents >= 0) data.valueCents = body.valueCents;
  if (!Object.keys(data).length) return NextResponse.json({ error: 'No valid changes supplied' }, { status: 400 });

  const updated = await db.deal.update({ where: { id }, data, include: { contact: true, pipeline: true, stage: true } });
  await writeAuditEvent({ organizationId: membership.organizationId, userId: membership.userId, action: 'updated', entityType: 'deal', entityId: id, metadata: data });
  return NextResponse.json({ deal: updated });
}
