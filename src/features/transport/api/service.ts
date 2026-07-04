'use server';

import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { db } from '@/db';
import {
  deliveryOrders,
  fuelPrices,
  inventoryLots,
  productSkus,
  shipmentPlans,
  warehouses
} from '@/db/schema';
import { requireOrgContext } from '@/lib/auth-context';
import { estimateFreightCost } from '../utils/freight';
import { estimateHours, haversineKm } from '../utils/route';
import { optimizeRoute } from '../utils/route-optimizer';
import type { CreateDeliveryOrderPayload, FindSourcePayload, RouteOption } from './types';

function mapFuelTypeToDb(fuelType: 'ron95' | 'ron92' | 'diesel' | 'e5') {
  if (fuelType === 'diesel') return 'DIESEL';
  if (fuelType === 'ron95') return 'RON95';
  if (fuelType === 'ron92') return 'RON92';
  return 'E5';
}

export async function listFuelPrices(limit = 60) {
  const { orgId } = await requireOrgContext();
  const rows = await db
    .select()
    .from(fuelPrices)
    .where(or(isNull(fuelPrices.orgId), eq(fuelPrices.orgId, orgId)))
    .orderBy(desc(fuelPrices.effectiveDate), desc(fuelPrices.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    priceVnd: Number(row.pricePerLiter),
    region: row.orgId ? 'org' : 'national'
  }));
}

export async function getLatestFuelPrice(fuelType: 'ron95' | 'ron92' | 'diesel' | 'e5') {
  const rows = await db
    .select()
    .from(fuelPrices)
    .where(eq(fuelPrices.fuelType, mapFuelTypeToDb(fuelType) as never))
    .orderBy(desc(fuelPrices.effectiveDate))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertFuelPrice(input: {
  fuelType: 'ron95' | 'ron92' | 'diesel' | 'e5';
  pricePerLiter: number;
  effectiveDate: string;
}) {
  const { orgId } = await requireOrgContext();
  const [row] = await db
    .insert(fuelPrices)
    .values({
      ...input,
      fuelType: mapFuelTypeToDb(input.fuelType) as never,
      pricePerLiter: String(input.pricePerLiter),
      orgId,
      source: 'manual'
    })
    .returning({ id: fuelPrices.id });
  return row;
}

export async function listDeliveryOrders() {
  const { orgId } = await requireOrgContext();
  return db
    .select()
    .from(deliveryOrders)
    .where(eq(deliveryOrders.orgId, orgId))
    .orderBy(desc(deliveryOrders.createdAt));
}

export async function createDeliveryOrder(payload: CreateDeliveryOrderPayload) {
  const { orgId } = await requireOrgContext();
  const [row] = await db
    .insert(deliveryOrders)
    .values({
      orgId,
      warehouseId: payload.warehouseId ?? null,
      destination: payload.destination ?? payload.destinationAddress ?? '',
      destinationLat: payload.destinationLat ?? null,
      destinationLng: payload.destinationLng ?? null,
      requiredSkus: (payload.requiredSkus ?? (payload.skuId ? [payload.skuId] : [])).map((sku) => ({
        skuId: sku,
        qty: payload.qtyRequired ?? 1
      })),
      preferredDate: payload.preferredDate ?? payload.requestDate ?? null
    })
    .returning({ id: deliveryOrders.id });
  return row;
}

export async function updateDeliveryOrderStatus(
  id: string,
  status: 'pending' | 'planned' | 'dispatched' | 'delivered'
) {
  const { orgId } = await requireOrgContext();
  await db
    .update(deliveryOrders)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(deliveryOrders.id, id), eq(deliveryOrders.orgId, orgId)));
}

async function getWarehouseAvailability(orgId: string, skuId: string) {
  const [warehouseRows, lotRows] = await Promise.all([
    db.select().from(warehouses).where(eq(warehouses.orgId, orgId)),
    db
      .select({
        warehouseId: inventoryLots.warehouseId,
        qty: inventoryLots.qty
      })
      .from(inventoryLots)
      .where(
        and(
          eq(inventoryLots.orgId, orgId),
          eq(inventoryLots.skuId, skuId),
          eq(inventoryLots.status, 'available')
        )
      )
  ]);

  const qtyByWarehouse = lotRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.warehouseId] = (acc[row.warehouseId] ?? 0) + Number(row.qty);
    return acc;
  }, {});

  return warehouseRows.map((warehouse) => ({
    ...warehouse,
    availableQty: Math.round((qtyByWarehouse[warehouse.id] ?? 0) * 100) / 100
  }));
}

export async function planRoute(orderId: string) {
  const { orgId } = await requireOrgContext();

  const [order] = await db
    .select()
    .from(deliveryOrders)
    .where(and(eq(deliveryOrders.id, orderId), eq(deliveryOrders.orgId, orgId)));
  if (!order) throw new Error('Khong tim thay don van chuyen');

  const requirement = (order.requiredSkus as Array<{ skuId: string; qty: number }>)[0];
  if (!requirement?.skuId) {
    throw new Error('Don van chuyen chua co SKU can cap');
  }

  const [availableWarehouses, latestDiesel] = await Promise.all([
    getWarehouseAvailability(orgId, requirement.skuId),
    getLatestFuelPrice('diesel')
  ]);

  const result = optimizeRoute(
    availableWarehouses.map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
      lat: warehouse.lat ?? 0,
      lng: warehouse.lng ?? 0,
      availableQty: warehouse.availableQty
    })),
    {
      destination: order.destination,
      destinationLat: order.destinationLat ?? 0,
      destinationLng: order.destinationLng ?? 0,
      qtyRequired: requirement.qty
    },
    {
      fuelPricePerLiter: latestDiesel ? Number(latestDiesel.pricePerLiter) : undefined
    }
  );

  const [plan] = await db
    .insert(shipmentPlans)
    .values({
      orgId,
      orderId,
      routeWarehouseIds: result.stops.map((stop) => stop.warehouseId),
      totalDistanceKm: result.totalDistanceKm,
      estimatedHours: result.estimatedHours,
      fuelCostEstimate: result.fuelCostVnd ? String(result.fuelCostVnd) : null
    })
    .returning({ id: shipmentPlans.id });

  await db
    .update(deliveryOrders)
    .set({ status: 'planned', updatedAt: new Date() })
    .where(eq(deliveryOrders.id, orderId));

  return { planId: plan.id, ...result };
}

export async function createShipmentRequest(payload: CreateDeliveryOrderPayload) {
  return createDeliveryOrder(payload);
}

export async function fulfillShipmentRequest(data: { id: string }) {
  return updateDeliveryOrderStatus(data.id, 'dispatched');
}

export async function findOptimalSourceWarehouses(data: FindSourcePayload): Promise<RouteOption[]> {
  const { orgId } = await requireOrgContext();
  if (!data.skuId || !data.qtyRequired) {
    return [];
  }

  const [availableWarehouses, latestDiesel, skuRow] = await Promise.all([
    getWarehouseAvailability(orgId, data.skuId),
    getLatestFuelPrice('diesel'),
    db
      .select({ id: productSkus.id, unit: productSkus.unit })
      .from(productSkus)
      .where(and(eq(productSkus.orgId, orgId), eq(productSkus.id, data.skuId)))
      .limit(1)
      .then((rows) => rows[0] ?? null)
  ]);

  const fuelPricePerLiter = latestDiesel ? Number(latestDiesel.pricePerLiter) : 0;
  const destinationLat = data.destinationLat ?? 0;
  const destinationLng = data.destinationLng ?? 0;

  const singleResults = availableWarehouses
    .filter((warehouse) => warehouse.availableQty > 0)
    .map((warehouse) => {
      const distanceKm =
        warehouse.lat && warehouse.lng
          ? Math.round(
              haversineKm(warehouse.lat, warehouse.lng, destinationLat, destinationLng) * 10
            ) / 10
          : 0;
      const estimatedHours = Math.round(estimateHours(distanceKm) * 10) / 10;
      const fuelCostEstimate = fuelPricePerLiter
        ? Math.round((distanceKm / 100) * 12 * fuelPricePerLiter)
        : 0;
      return {
        warehouseId: warehouse.id,
        warehouseCode: warehouse.code,
        warehouseName: warehouse.name,
        availableQty: warehouse.availableQty,
        distanceKm,
        estimatedHours,
        fuelCostEstimate,
        freightCostEstimate: estimateFreightCost(
          distanceKm,
          Math.min(warehouse.availableQty, data.qtyRequired!)
        ),
        coverageMode: warehouse.availableQty >= data.qtyRequired! ? 'single' : 'multi',
        coveredQty: Math.min(warehouse.availableQty, data.qtyRequired!),
        routeWarehouseIds: [warehouse.id]
      } satisfies RouteOption;
    });

  const multiRoute = optimizeRoute(
    availableWarehouses.map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
      lat: warehouse.lat ?? 0,
      lng: warehouse.lng ?? 0,
      availableQty: warehouse.availableQty
    })),
    {
      destination: data.destinationAddress ?? skuRow?.unit ?? '',
      destinationLat,
      destinationLng,
      qtyRequired: data.qtyRequired
    },
    { fuelPricePerLiter }
  );

  const results = [
    ...singleResults,
    ...(multiRoute.stops.length > 1 || multiRoute.coverageMode === 'multi'
      ? [
          {
            warehouseId: multiRoute.stops[0]?.warehouseId ?? 'multi',
            warehouseCode: 'MULTI',
            warehouseName: 'Phuong an ghep nhieu kho',
            availableQty: multiRoute.coveredQty,
            distanceKm: multiRoute.totalDistanceKm,
            estimatedHours: multiRoute.estimatedHours,
            fuelCostEstimate: multiRoute.fuelCostVnd ?? 0,
            freightCostEstimate: multiRoute.freightCostVnd,
            coverageMode: 'multi' as const,
            coveredQty: multiRoute.coveredQty,
            routeWarehouseIds: multiRoute.stops.map((stop) => stop.warehouseId)
          } satisfies RouteOption
        ]
      : [])
  ];

  return results
    .filter((option) => option.availableQty > 0)
    .sort((a, b) => {
      const coverageScore = b.coveredQty - a.coveredQty;
      if (coverageScore !== 0) return coverageScore;
      const distanceScore = a.distanceKm - b.distanceKm;
      if (distanceScore !== 0) return distanceScore;
      return a.freightCostEstimate - b.freightCostEstimate;
    });
}
