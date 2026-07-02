import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNotNull } from 'drizzle-orm';
import { db } from '@/db';
import { warehouses, locations, inventoryLots, slottingRuns } from '@/db/schema';
import { createNotification } from '@/features/notifications/api/service';
import { verifyCronRequest } from '@/lib/cron-auth';
import { runStorageOptimizer } from '@/features/warehouses/utils/storage-optimizer';

export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  const allWarehouses = await db
    .select({ id: warehouses.id, orgId: warehouses.orgId })
    .from(warehouses);

  let totalMoved = 0;

  for (const warehouse of allWarehouses) {
    const [locs, lots] = await Promise.all([
      db.select().from(locations).where(eq(locations.warehouseId, warehouse.id)),
      db
        .select()
        .from(inventoryLots)
        .where(
          and(eq(inventoryLots.warehouseId, warehouse.id), isNotNull(inventoryLots.locationId))
        )
    ]);

    if (lots.length === 0) continue;

    const recommendations = runStorageOptimizer(
      lots.map((l) => ({
        id: l.id,
        skuId: l.skuId,
        qty: l.qty,
        expiryDate: l.expiryDate ?? null,
        receiveDate: l.createdAt?.toISOString() ?? new Date().toISOString(),
        currentLocationId: l.locationId ?? null,
        strategy: 'FEFO' as const
      })),
      locs.map((l) => ({
        id: l.id,
        level: l.level ?? null,
        distanceToDock: l.distanceToDock ?? null,
        capacityPallets: null,
        zoneId: l.zoneId ?? null
      }))
    );

    const highPriorityCount = recommendations.filter((r) => r.priority === 'high').length;

    if (recommendations.length > 0) {
      await db.insert(slottingRuns).values({
        orgId: warehouse.orgId,
        warehouseId: warehouse.id,
        runAt: new Date(),
        movedCount: recommendations.length,
        recommendations: recommendations as any
      });

      if (highPriorityCount > 0) {
        await createNotification(warehouse.orgId, {
          warehouseId: warehouse.id,
          sourceType: 'reslotting',
          title: `Cần di chuyển ${highPriorityCount} lô hàng sắp hết hạn`,
          body: `Hệ thống phát hiện ${highPriorityCount} lô hàng ưu tiên cao cần tái sắp xếp vị trí kho.`
        });
      }

      totalMoved += recommendations.length;
    }
  }

  return NextResponse.json({
    status: 'ok',
    totalMoves: totalMoved,
    warehouses: allWarehouses.length
  });
}
