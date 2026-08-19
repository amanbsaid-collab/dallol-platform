import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, string> = {
    database: 'down',
    openai: 'configured',
  };

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = 'up';
  } catch {
    checks.database = 'down';
  }

  const databaseReady = checks.database === 'up';
  const openAIReady = Boolean(process.env.OPENAI_API_KEY);
  checks.openai = openAIReady ? 'configured' : 'missing';

  const ready = databaseReady && openAIReady;

  return NextResponse.json(
    {
      ok: ready,
      service: 'dallol-platform',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
