'use server';

import { and, eq, desc, asc, count, gte, sum } from 'drizzle-orm';
import { db } from '@/db';
import { shipmentRequests, fuelPrices, inventoryLots, warehouses } from '@/db/schema';
import { requireOrgContext } from '@/lib/auth-context';
import { haversineKm, estimateHours } from '../utils/route';
import type {
  ShipmentRequestFilters,
  FindSourcePayload,
  FulfillShipmentPayload,
  FuelPriceFilters,
  RouteOption
} from './types';

export async function findOptimalSourceWarehouses(payload: FindSourcePayload): Promise<RouteOption[]> {
  const { orgId } = await requireOrgContext();

  // Aggregate available qty per warehouse for the SKU
  const stockRows = await db
    .select({
      warehouseId: inventoryLots.warehouseId,
      availableQty: sum(inventoryLots.qty).mapWith(Number)
    })
    .from(inventoryLots)
    .where(
      and(
        eq(inventoryLots.orgId, orgId),
        eq(inventoryLots.skuId, payload.skuId),
        eq(inventoryLots.status, 'available')
      )
    )
    .groupBy(inventoryLots.warehouseId);

  const warehouseRows = await db
    .select()
    .from(warehouses)
    .where(eq(warehouses.orgId, orgId));

  const whMap = new Map(warehouseRows.map((w) => [w.id, w]));

  const options: RouteOption[] = stockRows
    .filter((s) => s.warehouseId && (s.availableQty ?? 0) > 0)
    .map((s) => {
      const wh = whMap.get(s.warehouseId!);
      const distanceKm =
        wh?.lat != null && wh?.lng != null
          ? haversineKm(wh.lat, wh.lng, payload.destinationLat, payload.destinationLng)
          : 9999;
      return {
        warehouseId: s.warehouseId!,
        warehouseName: wh?.name ?? 'Unknown',
        warehouseCode: wh?.code ?? '',
        availableQty: s.availableQty ?? 0,
        distanceKm: Math.round(distanceKm * 10) / 10,
        estimatedHours: Math.round(estimateHours(distanceKm) * 10) / 10
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return options;
}

export async function getShipmentRequests(filters: ShipmentRequestFilters = {}) {
  const { orgId } = await requireOrgContext();
  const { page = 1, limit = 20 } = filters;
  const conditions = [eq(shipmentRequests.orgId, orgId)];
  if (filters.status) conditions.push(eq(shipmentRequests.status, filters.status));
  if (filters.skuId) conditions.push(eq(shipmentRequests.skuId, filters.skuId));

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(shipmentRequests).where(and(...conditions)).orderBy(desc(shipmentRequests.requestDate)).limit(limit).offset((page - 1) * limit),
    db.select({ total: count() }).from(shipmentRequests).where(and(...conditions))
  ]);
  return { data: rows, total, page, limit, pageCount: Math.ceil(total / limit) };
}

export async function createShipmentRequest(payload: {
  skuId: string;
  qtyRequired: number;
  destinationLat?: number;
  destinationLng?: number;
  destinationAddress?: string;
  requestDate: string;
  note?: string;
}) {
  const { orgId } = await requireOrgContext();
  const [row] = await db.insert(shipmentRequests).values({ ...payload, orgId }).returning();
  return row;
}

export async function fulfillShipmentRequest(payload: FulfillShipmentPayload) {
  const { orgId } = await requireOrgContext();
  const [row] = await db
    .update(shipmentRequests)
    .set({ status: 'fulfilled', resolvedWarehouseId: payload.resolvedWarehouseId })
    .where(and(eq(shipmentRequests.id, payload.requestId), eq(shipmentRequests.orgId, orgId)))
    .returning();
  return row;
}

export async function getFuelPrices(filters: FuelPriceFilters = {}) {
  const conditions = [];
  if (filters.region) conditions.push(eq(fuelPrices.region, filters.region));
  if (filters.fuelType) conditions.push(eq(fuelPrices.fuelType, filters.fuelType));

  return db
    .select()
    .from(fuelPrices)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(fuelPrices.effectiveDate));
}

export async function upsertFuelPrice(data: {
  region: string;
  fuelType: 'RON95' | 'RON92' | 'DO' | 'DIESEL';
  priceVnd: number;
  effectiveDate: string;
  source?: string;
}) {
  const [row] = await db
    .insert(fuelPrices)
    .values(data)
    .onConflictDoNothing()
    .returning();
  return row;
}
