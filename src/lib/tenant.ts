import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth';

export async function getCurrentMembership() {
  const session = await requireSession();
  return db.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function requireOrganizationMembership() {
  const membership = await getCurrentMembership();
  if (!membership) throw new Error('ORGANIZATION_MEMBERSHIP_REQUIRED');
  return membership;
}
