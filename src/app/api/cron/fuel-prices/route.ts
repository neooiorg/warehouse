// ============================================================
// Cron — Daily fuel/freight price scrape
// ============================================================
// Scheduled by vercel.json (see project root). Will scrape public fuel-price
// sources (e.g. Petrolimex / Bo Cong Thuong), write to FuelPriceHistory, and
// on failure fall back to the last known price plus a stale-data notification
// via createNotification(). Implemented in Phase 6 (Transportation) once
// FuelPriceHistory exists — this route currently only wires up the auth gate
// and shape.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';

export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  return NextResponse.json({
    status: 'not_implemented',
    message: 'Fuel price scraping ships in Phase 6 (Transportation).'
  });
}
