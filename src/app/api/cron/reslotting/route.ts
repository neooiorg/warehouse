import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { inventoryLots, locations, productSkus, slottingRuns, warehouses } from '@/db/schema';
import { createNotification } from '@/features/notifications/api/service';
import {
  computeReslottingSuggestions,
  type ReslottingLocation,
  type ReslottingLot
} from '@/features/inventory/utils/reslotting';
import { verifyCronRequest } from '@/lib/cron-auth';

export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  const allWarehouses = await db
    .select({ id: warehouses.id, orgId: warehouses.orgId })
    .from(warehouses);

  let totalRecommendations = 0;

  for (const warehouse of allWarehouses) {
    const [lotRows, locationRows] = await Promise.all([
      db
        .select({
          id: inventoryLots.id,
          lotNo: inventoryLots.lotNo,
          skuId: inventoryLots.skuId,
          locationId: inventoryLots.locationId,
          locationCode: locations.code,
          locationType: locations.type,
          distanceToDock: locations.distanceToDock,
          receivedDate: inventoryLots.receivedDate,
          expiryDate: inventoryLots.expiryDate,
          qty: inventoryLots.qty,
          storageClass: productSkus.storageClassLabel,
          weight: productSkus.weight,
          allocationSortField: productSkus.allocationSortField,
          allocationSortDirection: productSkus.allocationSortDirection
        })
        .from(inventoryLots)
        .innerJoin(productSkus, eq(inventoryLots.skuId, productSkus.id))
        .leftJoin(locations, eq(inventoryLots.locationId, locations.id))
        .where(
          and(
            eq(inventoryLots.orgId, warehouse.orgId),
            eq(inventoryLots.warehouseId, warehouse.id),
            eq(inventoryLots.status, 'available')
          )
        ),
      db
        .select({
          id: locations.id,
          code: locations.code,
          type: locations.type,
          distanceToDock: locations.distanceToDock,
          capacityVolume: locations.capacityVolume,
          capacityWeight: locations.capacityWeight
        })
        .from(locations)
        .where(and(eq(locations.orgId, warehouse.orgId), eq(locations.warehouseId, warehouse.id)))
    ]);

    const recommendations = computeReslottingSuggestions(
      lotRows as ReslottingLot[],
      locationRows as ReslottingLocation[]
    );
    if (recommendations.length === 0) continue;

    await db.insert(slottingRuns).values({
      orgId: warehouse.orgId,
      warehouseId: warehouse.id,
      runAt: new Date(),
      movedCount: recommendations.length,
      recommendations: recommendations.map((item) => ({
        lotId: item.lotId,
        fromLocationId: item.currentLocationId,
        toLocationId: item.recommendedLocationId ?? '',
        reason: item.reason
      }))
    });

    const highPriorityCount = recommendations.filter((item) => item.priority === 'high').length;
    await createNotification(warehouse.orgId, {
      warehouseId: warehouse.id,
      sourceType: 'reslotting',
      title:
        highPriorityCount > 0
          ? `Co ${highPriorityCount} de xuat reslotting uu tien cao`
          : `Co ${recommendations.length} de xuat reslotting moi`,
      body:
        highPriorityCount > 0
          ? 'He thong phat hien cac lot can dua gan dock hoac doi vi tri theo quy tac xuat hang.'
          : 'He thong da tao de xuat sap xep lai vi tri luu tru tu du lieu inbound/outbound moi nhat.'
    });

    totalRecommendations += recommendations.length;
  }

  return NextResponse.json({
    status: 'ok',
    totalRecommendations,
    warehouses: allWarehouses.length
  });
}
