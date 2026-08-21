import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentMembership } from '@/lib/tenant';
import { writeAuditEvent } from '@/lib/audit';

export async function GET() {
  const membership = await getCurrentMembership();
  if (!membership) return NextResponse.json({ error: 'Organization membership required' }, { status: 403 });

  const deals = await db.deal.findMany({
    where: { contact: { organizationId: membership.organizationId } },
    include: { contact: true, pipeline: true, stage: true },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ deals });
}

export async function POST(request: Request) {
  const membership = await getCurrentMembership();
  if (!membership) return NextResponse.json({ error: 'Organization membership required' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const contactId = typeof body?.contactId === 'string' ? body.contactId : '';
  const pipelineId = typeof body?.pipelineId === 'string' ? body.pipelineId : '';
  const stageId = typeof body?.stageId === 'string' ? body.stageId : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const valueCents = Number.isInteger(body?.valueCents) ? body.valueCents : 0;
  if (!contactId || !pipelineId || !stageId || !name) return NextResponse.json({ error: 'contactId, pipelineId, stageId and name are required' }, { status: 400 });
  if (valueCents < 0) return NextResponse.json({ error: 'valueCents must be non-negative' }, { status: 400 });

  const [contact, pipeline, stage] = await Promise.all([
    db.contact.findFirst({ where: { id: contactId, organizationId: membership.organizationId } }),
    db.pipeline.findFirst({ where: { id: pipelineId, organizationId: membership.organizationId } }),
    db.pipelineStage.findFirst({ where: { id: stageId, pipelineId } }),
  ]);
  if (!contact || !pipeline || !stage) return NextResponse.json({ error: 'Invalid CRM ownership or stage' }, { status: 400 });

  const deal = await db.deal.create({ data: { contactId, pipelineId, stageId, name, valueCents } });
  await writeAuditEvent({ organizationId: membership.organizationId, userId: membership.userId, action: 'created', entityType: 'deal', entityId: deal.id });
  return NextResponse.json({ deal }, { status: 201 });
}
