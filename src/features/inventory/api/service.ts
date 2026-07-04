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
  LotOption,
  InventoryImportKind,
  InventoryImportResult,
  InventoryImportRow
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
    throw new Error('Không tìm thấy SKU trong tổ chức hiện tại');
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
      `Không đủ tồn kho: cần ${payload.qty}, hiện chỉ có ${result.fulfilledQty} trong các lot khả dụng`
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
    throw new Error('Không tìm thấy lô trong tổ chức hiện tại');
  }
  if (payload.qty <= 0 || payload.qty > lot.qty) {
    throw new Error(`Số lượng chuyển phải nằm trong khoảng 1 đến ${lot.qty}`);
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
          eq(inventoryLots.orgId, orgId),
          eq(inventoryLots.warehouseId, warehouseId),
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
      .where(and(eq(locations.orgId, orgId), eq(locations.warehouseId, warehouseId)))
  ]);

  return computeReslottingSuggestions(
    lotRows as Parameters<typeof computeReslottingSuggestions>[0],
    locationRows as Parameters<typeof computeReslottingSuggestions>[1]
  );
}

export async function importInventoryRows(
  kind: InventoryImportKind,
  rows: InventoryImportRow[]
): Promise<InventoryImportResult> {
  const { orgId } = await requireOrgContext();
  const errors: InventoryImportResult['errors'] = [];

  if (rows.length === 0) {
    return { importedCount: 0, errors: [{ line: 1, message: 'File khong co du lieu.' }] };
  }

  const [warehouseRows, skuRows, locationRows, employeeRows, lotRows] = await Promise.all([
    db.select().from(warehouses).where(eq(warehouses.orgId, orgId)),
    db.select().from(productSkus).where(eq(productSkus.orgId, orgId)),
    db.select().from(locations).where(eq(locations.orgId, orgId)),
    db.select().from(employees).where(eq(employees.orgId, orgId)),
    db.select().from(inventoryLots).where(eq(inventoryLots.orgId, orgId))
  ]);

  const warehouseMap = new Map(warehouseRows.map((row) => [row.code.trim().toLowerCase(), row]));
  const skuMap = new Map(skuRows.map((row) => [row.sku.trim().toLowerCase(), row]));
  const locationMap = new Map(
    locationRows.map((row) => [`${row.warehouseId}:${row.code.trim().toLowerCase()}`, row])
  );
  const employeeMap = new Map(employeeRows.map((row) => [row.fullName.trim().toLowerCase(), row]));
  const lotMap = new Map(
    lotRows.map((row) => [`${row.warehouseId}:${row.skuId}:${row.lotNo.trim().toLowerCase()}`, row])
  );

  const operations: Array<() => Promise<void>> = [];

  for (const row of rows) {
    const warehouse = warehouseMap.get(row.warehouseCode.trim().toLowerCase());
    const sku = skuMap.get(row.sku.trim().toLowerCase());
    const employee = row.performedByName
      ? employeeMap.get(row.performedByName.trim().toLowerCase())
      : null;

    if (!warehouse) {
      errors.push({ line: row.line, message: `Khong tim thay kho "${row.warehouseCode}".` });
      continue;
    }
    if (!sku) {
      errors.push({ line: row.line, message: `Khong tim thay SKU "${row.sku}".` });
      continue;
    }
    if (!(row.qty > 0)) {
      errors.push({ line: row.line, message: 'So luong phai lon hon 0.' });
      continue;
    }
    if (row.performedByName && !employee) {
      errors.push({
        line: row.line,
        message: `Khong tim thay nhan vien "${row.performedByName}".`
      });
      continue;
    }

    if (kind === 'inbound') {
      if (!row.lotNo || !row.locationCode || !row.receivedDate) {
        errors.push({ line: row.line, message: 'Inbound can lotNo, locationCode, receivedDate.' });
        continue;
      }
      const lotKey = `${warehouse.id}:${sku.id}:${row.lotNo.trim().toLowerCase()}`;
      if (lotMap.has(lotKey)) {
        errors.push({ line: row.line, message: `Lot "${row.lotNo}" da ton tai trong kho nay.` });
        continue;
      }
      const location = locationMap.get(`${warehouse.id}:${row.locationCode.trim().toLowerCase()}`);
      if (!location) {
        errors.push({ line: row.line, message: `Khong tim thay vi tri "${row.locationCode}".` });
        continue;
      }

      operations.push(async () => {
        await createInboundReceipt({
          warehouseId: warehouse.id,
          skuId: sku.id,
          locationId: location.id,
          lotNo: row.lotNo!,
          qty: row.qty,
          receivedDate: row.receivedDate!,
          expiryDate: row.expiryDate ?? null,
          performedBy: employee?.id ?? null,
          note: row.note ?? null
        });
      });
      continue;
    }

    if (kind === 'outbound') {
      operations.push(async () => {
        await createOutboundShipment({
          warehouseId: warehouse.id,
          skuId: sku.id,
          qty: row.qty,
          performedBy: employee?.id ?? null,
          note: row.note ?? null
        });
      });
      continue;
    }

    if (!row.lotNo || !row.toLocationCode) {
      errors.push({ line: row.line, message: 'Transfer can lotNo va toLocationCode.' });
      continue;
    }

    const lot = lotRows.find(
      (candidate) =>
        candidate.warehouseId === warehouse.id &&
        candidate.skuId === sku.id &&
        candidate.lotNo.toLowerCase() === row.lotNo!.trim().toLowerCase()
    );
    const toLocation = locationMap.get(
      `${warehouse.id}:${row.toLocationCode.trim().toLowerCase()}`
    );

    if (!lot) {
      errors.push({ line: row.line, message: `Khong tim thay lot "${row.lotNo}".` });
      continue;
    }
    if (!toLocation) {
      errors.push({
        line: row.line,
        message: `Khong tim thay vi tri dich "${row.toLocationCode}".`
      });
      continue;
    }

    operations.push(async () => {
      await createTransfer({
        lotId: lot.id,
        toLocationId: toLocation.id,
        qty: row.qty,
        performedBy: employee?.id ?? null,
        note: row.note ?? null
      });
    });
  }

  if (errors.length > 0) {
    return { importedCount: 0, errors };
  }

  for (const operation of operations) {
    await operation();
  }

  return { importedCount: operations.length, errors: [] };
}

export async function searchLotHistory(query: string, warehouseId?: string) {
  const { orgId } = await requireOrgContext();
  const term = `%${query}%`;
  const conditions = [
    eq(inventoryLots.orgId, orgId),
    or(
      ilike(inventoryLots.lotNo, term),
      ilike(productSkus.sku, term),
      ilike(productSkus.name, term)
    )!
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
