import { NextResponse } from 'next/server';
import { getCurrentMembership } from '@/lib/tenant';
import { db } from '@/lib/db';
import { writeAuditEvent } from '@/lib/audit';

export async function GET() {
  const membership = await getCurrentMembership();
  if (!membership) return NextResponse.json({ error: 'Organization membership required' }, { status: 403 });

  const pipelines = await db.pipeline.findMany({
    where: { organizationId: membership.organizationId },
    include: { stages: { orderBy: { position: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ pipelines });
}

export async function POST(request: Request) {
  const membership = await getCurrentMembership();
  if (!membership) return NextResponse.json({ error: 'Organization membership required' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const stages = Array.isArray(body?.stages) ? body.stages : [];

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const pipeline = await db.pipeline.create({
    data: {
      organizationId: membership.organizationId,
      name,
      stages: {
        create: stages.map((stage: unknown, index: number) => ({
          name: typeof stage === 'string' ? stage.trim() : `Stage ${index + 1}`,
          position: index,
        })),
      },
    },
    include: { stages: { orderBy: { position: 'asc' } } },
  });

  await writeAuditEvent({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: 'created',
    entityType: 'pipeline',
    entityId: pipeline.id,
  });

  return NextResponse.json({ pipeline }, { status: 201 });
}
