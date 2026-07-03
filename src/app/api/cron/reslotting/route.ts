import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';
import { db } from '@/db';
import { warehouses } from '@/db/schema';
import { getStorageOptimizationAdvice } from '@/features/inventory/api/service';
import { createNotification } from '@/features/notifications/api/service';

export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  const allWarehouses = await db.select({ id: warehouses.id, orgId: warehouses.orgId, name: warehouses.name }).from(warehouses);
  let totalSuggestions = 0;

  for (const wh of allWarehouses) {
    try {
      // getStorageOptimizationAdvice requires auth context, so we call the DB logic directly
      const { computeReslottingSuggestions } = await import('@/features/inventory/utils/reslotting');
      const { db: dbClient } = await import('@/db');
      const { inventoryLots, locations, productSkus } = await import('@/db/schema');
      const { and, eq, desc } = await import('drizzle-orm');

      const lots = await dbClient
        .select({
          id: inventoryLots.id,
          lotNo: inventoryLots.lotNo,
          skuId: inventoryLots.skuId,
          locationId: inventoryLots.locationId,
          locationCode: locations.code,
          distanceToDock: locations.distanceToDock,
          receivedDate: inventoryLots.receivedDate,
          expiryDate: inventoryLots.expiryDate,
          qty: inventoryLots.qty,
          storageClass: productSkus.storageClassLabel,
          allocationSortField: productSkus.allocationSortField,
          allocationSortDirection: productSkus.allocationSortDirection
        })
        .from(inventoryLots)
        .innerJoin(productSkus, eq(inventoryLots.skuId, productSkus.id))
        .leftJoin(locations, eq(inventoryLots.locationId, locations.id))
        .where(and(eq(inventoryLots.orgId, wh.orgId), eq(inventoryLots.warehouseId, wh.id), eq(inventoryLots.status, 'available')));

      const suggestions = computeReslottingSuggestions(lots as any);
      totalSuggestions += suggestions.length;

      if (suggestions.length > 0) {
        await createNotification(wh.orgId, {
          warehouseId: wh.id,
          sourceType: 'reslotting',
          title: `Kho ${wh.name}: ${suggestions.length} đề xuất đảo vị trí`,
          body: `Có ${suggestions.filter((s) => s.priority === 'high').length} ưu tiên cao cần xử lý để đảm bảo quy tắc FIFO/FEFO/LEFO.`
        });
      }
    } catch {
      // continue to next warehouse
    }
  }

  return NextResponse.json({ status: 'done', totalSuggestions });
}
