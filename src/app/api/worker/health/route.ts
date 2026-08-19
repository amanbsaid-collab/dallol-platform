import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const queued = await db.job.count({ where: { status: 'QUEUED' } });
    const running = await db.job.count({ where: { status: 'RUNNING' } });
    const stale = await db.job.count({ where: { status: 'RUNNING', leaseUntil: { lt: new Date() } } });
    return NextResponse.json({ status: 'ok', queue: { queued, running, stale }, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: 'degraded', database: 'error' }, { status: 503 });
  }
}
