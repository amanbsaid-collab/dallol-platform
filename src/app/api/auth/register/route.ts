import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, hashPassword, normalizeEmail } from '@/lib/auth';
import type { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : null;
  const organizationName = typeof body?.organizationName === 'string' ? body.organizationName.trim() : '';

  if (!email || !email.includes('@') || password.length < 12 || !organizationName) {
    return NextResponse.json({ error: 'email, password (12+ characters), and organizationName are required' }, { status: 400 });
  }
  if (await db.user.findUnique({ where: { email } })) {
    return NextResponse.json({ error: 'Account already exists' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const createdUser = await tx.user.create({ data: { email, name, passwordHash } });
    const organization = await tx.organization.create({ data: { name: organizationName } });
    await tx.membership.create({ data: { userId: createdUser.id, organizationId: organization.id, role: 'OWNER' } });
    return createdUser;
  });

  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } }, { status: 201 });
}
