'use server';

import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db';
import {
  inventoryLots,
  inventoryTransactions,
  productSkus,
  warehouses,
  locations,
  employees
} from '@/db/schema';
import { requireOrgContext } from '@/lib/auth-context';
import { assertWarehouseInOrg } from '@/lib/warehouse-access';
import { allocateLots } from '../utils/allocation';
import type {
  LotFilters,
  LotWithDetails,
  TransactionFilters,
  TransactionWithDetails,
  InboundReceiptPayload,
  OutboundShipmentPayload,
  TransferPayload,
  LotOption
} from './types';

const fromLocations = alias(locations, 'from_locations');
const toLocations = alias(locations, 'to_locations');

export async function getLotOptions(warehouseId: string): Promise<LotOption[]> {
  const { orgId } = await requireOrgContext();

  return db
    .select({
      id: inventoryLots.id,
      lotNo: inventoryLots.lotNo,
      sku: productSkus.sku,
      qty: inventoryLots.qty,
      locationCode: locations.code,
      warehouseId: inventoryLots.warehouseId
    })
    .from(inventoryLots)
    .innerJoin(productSkus, eq(inventoryLots.skuId, productSkus.id))
    .leftJoin(locations, eq(inventoryLots.locationId, locations.id))
    .where(
      and(
        eq(inventoryLots.orgId, orgId),
        eq(inventoryLots.warehouseId, warehouseId),
        eq(inventoryLots.status, 'available')
      )
    )
    .orderBy(desc(inventoryLots.receivedDate));
}

export async function getLots(filters: LotFilters): Promise<{
  data: LotWithDetails[];
  total: number;
}> {
  const { orgId } = await requireOrgContext();
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;

  const conditions = [eq(inventoryLots.orgId, orgId)];
  if (filters.warehouseId) conditions.push(eq(inventoryLots.warehouseId, filters.warehouseId));
  if (filters.skuId) conditions.push(eq(inventoryLots.skuId, filters.skuId));
  if (filters.status) conditions.push(eq(inventoryLots.status, filters.status));
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(or(ilike(inventoryLots.lotNo, term), ilike(productSkus.sku, term))!);
  }
  const where = and(...conditions);

  const [data, [{ count }]] = await Promise.all([
    db
      .select({
        id: inventoryLots.id,
        orgId: inventoryLots.orgId,
        skuId: inventoryLots.skuId,
        warehouseId: inventoryLots.warehouseId,
        locationId: inventoryLots.locationId,
        lotNo: inventoryLots.lotNo,
        qty: inventoryLots.qty,
        receivedDate: inventoryLots.receivedDate,
        expiryDate: inventoryLots.expiryDate,
        status: inventoryLots.status,
        createdAt: inventoryLots.createdAt,
        updatedAt: inventoryLots.updatedAt,
        sku: productSkus.sku,
        skuName: productSkus.name,
        warehouseCode: warehouses.code,
        locationCode: locations.code
      })
      .from(inventoryLots)
      .innerJoin(productSkus, eq(inventoryLots.skuId, productSkus.id))
      .innerJoin(warehouses, eq(inventoryLots.warehouseId, warehouses.id))
      .leftJoin(locations, eq(inventoryLots.locationId, locations.id))
      .where(where)
      .orderBy(desc(inventoryLots.receivedDate))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(inventoryLots)
      .innerJoin(productSkus, eq(inventoryLots.skuId, productSkus.id))
      .where(where)
  ]);

  return { data, total: count };
}

export async function getTransactions(filters: TransactionFilters): Promise<{
  data: TransactionWithDetails[];
  total: number;
}> {
  const { orgId } = await requireOrgContext();
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const conditions = [eq(inventoryTransactions.orgId, orgId)];
  if (filters.warehouseId)
    conditions.push(eq(inventoryTransactions.warehouseId, filters.warehouseId));
  if (filters.lotId) conditions.push(eq(inventoryTransactions.lotId, filters.lotId));
  if (filters.locationId) {
    conditions.push(
      sql`(${inventoryTransactions.fromLocationId} = ${filters.locationId} or ${inventoryTransactions.toLocationId} = ${filters.locationId})`
    );
  }
  const where = and(...conditions);
  const orderFn = filters.order === 'asc' ? asc : desc;

  const [data, [{ count }]] = await Promise.all([
    db
      .select({
        id: inventoryTransactions.id,
        orgId: inventoryTransactions.orgId,
        warehouseId: inventoryTransactions.warehouseId,
        type: inventoryTransactions.type,
        skuId: inventoryTransactions.skuId,
        lotId: inventoryTransactions.lotId,
        qty: inventoryTransactions.qty,
        fromLocationId: inventoryTransactions.fromLocationId,
        toLocationId: inventoryTransactions.toLocationId,
        performedBy: inventoryTransactions.performedBy,
        note: inventoryTransactions.note,
        occurredAt: inventoryTransactions.occurredAt,
        createdAt: inventoryTransactions.createdAt,
        updatedAt: inventoryTransactions.updatedAt,
        sku: productSkus.sku,
        skuName: productSkus.name,
        warehouseCode: warehouses.code,
        fromLocationCode: fromLocations.code,
        toLocationCode: toLocations.code,
        performedByName: employees.fullName
      })
      .from(inventoryTransactions)
      .innerJoin(productSkus, eq(inventoryTransactions.skuId, productSkus.id))
      .innerJoin(warehouses, eq(inventoryTransactions.warehouseId, warehouses.id))
      .leftJoin(fromLocations, eq(inventoryTransactions.fromLocationId, fromLocations.id))
      .leftJoin(toLocations, eq(inventoryTransactions.toLocationId, toLocations.id))
      .leftJoin(employees, eq(inventoryTransactions.performedBy, employees.id))
      .where(where)
      .orderBy(orderFn(inventoryTransactions.occurredAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(inventoryTransactions)
      .where(where)
  ]);

  return { data, total: count };
}

export async function createInboundReceipt(
  payload: InboundReceiptPayload
): Promise<{ lotId: string }> {
  const { orgId } = await requireOrgContext();
  await assertWarehouseInOrg(orgId, payload.warehouseId);

  return db.transaction(async (tx) => {
    const [lot] = await tx
      .insert(inventoryLots)
      .values({
        orgId,
        warehouseId: payload.warehouseId,
        skuId: payload.skuId,
        locationId: payload.locationId,
        lotNo: payload.lotNo,
        qty: payload.qty,
        receivedDate: payload.receivedDate,
        expiryDate: payload.expiryDate ?? null,
        status: 'available'
      })
      .returning();

    await tx.insert(inventoryTransactions).values({
      orgId,
      warehouseId: payload.warehouseId,
      type: 'inbound',
      skuId: payload.skuId,
      lotId: lot.id,
      qty: payload.qty,
      toLocationId: payload.locationId,
      performedBy: payload.performedBy ?? null,
      note: payload.note ?? null,
      occurredAt: new Date()
    });

    return { lotId: lot.id };
  });
}

export async function createOutboundShipment(
  payload: OutboundShipmentPayload
): Promise<{ pickedLotIds: string[]; fulfilledQty: number }> {
  const { orgId } = await requireOrgContext();
  await assertWarehouseInOrg(orgId, payload.warehouseId);

  const [sku] = await db
    .select()
    .from(productSkus)
    .where(eq(productSkus.id, payload.skuId))
    .limit(1);
  if (!sku || sku.orgId !== orgId) {
    throw new Error('SKU not found in this organization');
  }

  const candidateLots = await db
    .select()
    .from(inventoryLots)
    .where(
      and(
        eq(inventoryLots.orgId, orgId),
        eq(inventoryLots.warehouseId, payload.warehouseId),
        eq(inventoryLots.skuId, payload.skuId),
        eq(inventoryLots.status, 'available')
      )
    );

  const result = allocateLots(candidateLots, payload.qty, {
    sortField: sku.allocationSortField,
    sortDirection: sku.allocationSortDirection
  });

  if (result.shortfallQty > 0) {
    throw new Error(
      `Insufficient stock: requested ${payload.qty}, only ${result.fulfilledQty} available across current lots`
    );
  }

  await db.transaction(async (tx) => {
    for (const pick of result.picks) {
      const lot = candidateLots.find((l) => l.id === pick.lotId)!;
      const remainingQty = lot.qty - pick.qty;

      await tx
        .update(inventoryLots)
        .set({
          qty: remainingQty,
          status: remainingQty <= 0 ? 'depleted' : 'available'
        })
        .where(eq(inventoryLots.id, lot.id));

      await tx.insert(inventoryTransactions).values({
        orgId,
        warehouseId: payload.warehouseId,
        type: 'outbound',
        skuId: payload.skuId,
        lotId: lot.id,
        qty: pick.qty,
        fromLocationId: lot.locationId,
        performedBy: payload.performedBy ?? null,
        note: payload.note ?? null,
        occurredAt: new Date()
      });
    }
  });

  return { pickedLotIds: result.picks.map((p) => p.lotId), fulfilledQty: result.fulfilledQty };
}

export async function createTransfer(payload: TransferPayload): Promise<{ lotId: string }> {
  const { orgId } = await requireOrgContext();

  const [lot] = await db
    .select()
    .from(inventoryLots)
    .where(eq(inventoryLots.id, payload.lotId))
    .limit(1);
  if (!lot || lot.orgId !== orgId) {
    throw new Error('Lot not found in this organization');
  }
  if (payload.qty <= 0 || payload.qty > lot.qty) {
    throw new Error(`Transfer quantity must be between 1 and ${lot.qty}`);
  }

  const fromLocationId = lot.locationId;

  return db.transaction(async (tx) => {
    let destinationLotId: string;

    if (payload.qty === lot.qty) {
      // Moving the whole lot — just repoint its location.
      await tx
        .update(inventoryLots)
        .set({ locationId: payload.toLocationId })
        .where(eq(inventoryLots.id, lot.id));
      destinationLotId = lot.id;
    } else {
      // Partial transfer — split off a new lot at the destination and
      // shrink the source lot by the transferred quantity.
      await tx
        .update(inventoryLots)
        .set({ qty: lot.qty - payload.qty })
        .where(eq(inventoryLots.id, lot.id));

      const [destinationLot] = await tx
        .insert(inventoryLots)
        .values({
          orgId,
          warehouseId: lot.warehouseId,
          skuId: lot.skuId,
          locationId: payload.toLocationId,
          lotNo: lot.lotNo,
          qty: payload.qty,
          receivedDate: lot.receivedDate,
          expiryDate: lot.expiryDate,
          status: 'available'
        })
        .returning();
      destinationLotId = destinationLot.id;
    }

    await tx.insert(inventoryTransactions).values({
      orgId,
      warehouseId: lot.warehouseId,
      type: 'transfer',
      skuId: lot.skuId,
      lotId: destinationLotId,
      qty: payload.qty,
      fromLocationId,
      toLocationId: payload.toLocationId,
      performedBy: payload.performedBy ?? null,
      note: payload.note ?? null,
      occurredAt: new Date()
    });

    return { lotId: destinationLotId };
  });
}

// ─── Warehouse Optimization ──────────────────────────────────────────────────

export async function getStorageOptimizationAdvice(warehouseId: string) {
  const { orgId } = await requireOrgContext();
  const { computeReslottingSuggestions } = await import('../utils/reslotting');

  const lots = await db
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
    .where(
      and(
        eq(inventoryLots.orgId, orgId),
        eq(inventoryLots.warehouseId, warehouseId),
        eq(inventoryLots.status, 'available')
      )
    );

  return computeReslottingSuggestions(lots as Parameters<typeof computeReslottingSuggestions>[0]);
}

export async function searchLotHistory(query: string, warehouseId?: string) {
  const { orgId } = await requireOrgContext();
  const term = `%${query}%`;
  const conditions = [
    eq(inventoryLots.orgId, orgId),
    or(ilike(inventoryLots.lotNo, term), ilike(productSkus.sku, term), ilike(productSkus.name, term))!
  ];
  if (warehouseId) conditions.push(eq(inventoryLots.warehouseId, warehouseId));

  return db
    .select({
      id: inventoryLots.id,
      lotNo: inventoryLots.lotNo,
      sku: productSkus.sku,
      skuName: productSkus.name,
      warehouseCode: warehouses.code,
      locationCode: locations.code,
      qty: inventoryLots.qty,
      receivedDate: inventoryLots.receivedDate,
      expiryDate: inventoryLots.expiryDate,
      status: inventoryLots.status
    })
    .from(inventoryLots)
    .innerJoin(productSkus, eq(inventoryLots.skuId, productSkus.id))
    .innerJoin(warehouses, eq(inventoryLots.warehouseId, warehouses.id))
    .leftJoin(locations, eq(inventoryLots.locationId, locations.id))
    .where(and(...conditions))
    .orderBy(desc(inventoryLots.receivedDate))
    .limit(50);
}
