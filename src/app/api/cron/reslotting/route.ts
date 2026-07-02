// ============================================================
// Cron — Daily re-slotting suggestions
// ============================================================
// Scheduled by vercel.json (see project root). Will run ABC/velocity
// analysis over InventoryTransaction history per warehouse and write swap
// suggestions via createNotification() from the notifications feature.
// Implemented in Phase 2 (Warehouse Optimization) once InventoryTransaction
// exists — this route currently only wires up the auth gate and shape.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';

export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  return NextResponse.json({
    status: 'not_implemented',
    message: 'Re-slotting analysis ships in Phase 2 (Warehouse Optimization).'
  });
}
