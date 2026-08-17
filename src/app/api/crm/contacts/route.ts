import { NextResponse } from 'next/server';
import { getCurrentMembership } from '@/lib/tenant';
import { db } from '@/lib/db';
import { writeAuditEvent } from '@/lib/audit';

export async function GET() {
  const membership = await getCurrentMembership();
  if (!membership) return NextResponse.json({ error: 'Organization membership required' }, { status: 403 });

  const contacts = await db.contact.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ contacts });
}

export async function POST(request: Request) {
  const membership = await getCurrentMembership();
  if (!membership) return NextResponse.json({ error: 'Organization membership required' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const firstName = typeof body?.firstName === 'string' ? body.firstName.trim() : '';
  const lastName = typeof body?.lastName === 'string' ? body.lastName.trim() : null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : null;
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : null;
  const company = typeof body?.company === 'string' ? body.company.trim() : null;

  if (!firstName) return NextResponse.json({ error: 'firstName is required' }, { status: 400 });

  const contact = await db.contact.create({
    data: { organizationId: membership.organizationId, firstName, lastName, email, phone, company },
  });

  await writeAuditEvent({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: 'created',
    entityType: 'contact',
    entityId: contact.id,
  });

  return NextResponse.json({ contact }, { status: 201 });
}
