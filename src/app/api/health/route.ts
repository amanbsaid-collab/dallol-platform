import { getSystemHealth } from '@/lib/health';
import { NextResponse } from 'next/server';

export async function GET() {
  const health = await getSystemHealth();
  return NextResponse.json({
    ok: health.ok,
    service: 'dallol-platform',
    version: '0.4.1',
    database: health.database,
    timestamp: new Date().toISOString(),
  }, { status: health.ok ? 200 : 503 });
}
