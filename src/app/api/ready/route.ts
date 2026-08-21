import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      service: 'dallol-platform',
      checks: { database: 'up' },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        service: 'dallol-platform',
        checks: { database: 'down' },
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
