import { db } from '@/lib/db';

export async function getSystemHealth() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { ok: true, database: 'up' as const };
  } catch {
    return { ok: false, database: 'down' as const };
  }
}
