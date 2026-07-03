'use server';

import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { db } from '@/db';
import { fuelPrices, deliveryOrders, shipmentPlans, vehicles, warehouses } from '@/db/schema';
import { requireOrgContext } from '@/lib/auth-context';
import { optimizeRoute } from '../utils/route-optimizer';
import type { CreateDeliveryOrderPayload } from './types';

// ─── Fuel Prices ─────────────────────────────────────────────────────────────

export async function listFuelPrices(limit = 60) {
  const { orgId } = await requireOrgContext();
  return db
    .select()
    .from(fuelPrices)
    .where(or(isNull(fuelPrices.orgId), eq(fuelPrices.orgId, orgId)))
    .orderBy(desc(fuelPrices.effectiveDate), desc(fuelPrices.createdAt))
    .limit(limit);
}

export async function getLatestFuelPrice(fuelType: 'ron95' | 'ron92' | 'diesel' | 'e5') {
  const rows = await db
    .select()
    .from(fuelPrices)
    .where(eq(fuelPrices.fuelType, fuelType))
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
    .values({ ...input, pricePerLiter: String(input.pricePerLiter), orgId, source: 'manual' })
    .returning({ id: fuelPrices.id });
  return row;
}

// ─── Delivery Orders ──────────────────────────────────────────────────────────

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
      destination: payload.destination,
      destinationLat: payload.destinationLat ?? null,
      destinationLng: payload.destinationLng ?? null,
      requiredSkus: (payload.requiredSkus ?? []).map((sku) => ({ skuId: sku, qty: 1 })),
      preferredDate: payload.preferredDate ?? null
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

// ─── Route Planning ───────────────────────────────────────────────────────────

export async function planRoute(orderId: string) {
  const { orgId } = await requireOrgContext();

  const [order] = await db
    .select()
    .from(deliveryOrders)
    .where(and(eq(deliveryOrders.id, orderId), eq(deliveryOrders.orgId, orgId)));
  if (!order) throw new Error('Order not found');

  const [allWarehouses, latestDiesel] = await Promise.all([
    db.select().from(warehouses).where(eq(warehouses.orgId, orgId)),
    getLatestFuelPrice('diesel')
  ]);

  const skuIds = (order.requiredSkus as Array<{ skuId: string }>).map((r) => r.skuId);

  const result = optimizeRoute(
    allWarehouses.map((w) => ({
      id: w.id,
      name: w.name,
      lat: w.lat ?? 0,
      lng: w.lng ?? 0
    })),
    {
      destination: order.destination,
      destinationLat: order.destinationLat ?? 0,
      destinationLng: order.destinationLng ?? 0,
      requiredSkus: skuIds
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
      routeWarehouseIds: result.stops.map((s) => s.warehouseId),
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

export async function findOptimalSourceWarehouses(data: {
  skuId?: string;
  qtyRequired?: number;
  destinationLat?: number;
  destinationLng?: number;
  destinationAddress?: string;
}) {
  const { orgId } = await requireOrgContext();
  const allWarehouses = await db.select().from(warehouses).where(eq(warehouses.orgId, orgId));
  const { haversineKm, estimateHours } = await import('../utils/route');
  return allWarehouses.map((w, i) => ({
    warehouseId: w.id,
    warehouseCode: w.code ?? `WH${i + 1}`,
    warehouseName: w.name,
    availableQty: 0,
    distanceKm: data.destinationLat && data.destinationLng && w.lat && w.lng
      ? Math.round(haversineKm(w.lat, w.lng, data.destinationLat, data.destinationLng) * 10) / 10
      : 0,
    estimatedHours: data.destinationLat && data.destinationLng && w.lat && w.lng
      ? estimateHours(haversineKm(w.lat, w.lng, data.destinationLat, data.destinationLng))
      : 0
  })).sort((a, b) => a.distanceKm - b.distanceKm);
}
