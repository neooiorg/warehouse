import { NextRequest, NextResponse } from 'next/server';

// Every /api/cron/* route calls this first. Cron requests have no Clerk
// session (they run server-to-server on a schedule), so they can't use
// requireOrgContext — this is the equivalent gate for that context.
export function verifyCronRequest(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
