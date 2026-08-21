import { NextResponse } from 'next/server';

export async function GET() {
  // Render's readiness probe must only verify that the HTTP application
  // process is accepting requests. Dependency health is checked separately
  // by /api/health so a slow/unreachable database cannot prevent the web
  // process from becoming live.
  return NextResponse.json({
    ok: true,
    service: 'dallol-platform',
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
}
