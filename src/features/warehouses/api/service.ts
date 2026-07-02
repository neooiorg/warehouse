'use server';

import { and, asc, count, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { warehouses, zones, locations, docks } from '@/db/schema';
import { requireOrgContext } from '@/lib/auth-context';
import { assertWarehouseInOrg } from '@/lib/warehouse-access';
import type {
  WarehouseFilters,
  WarehouseWithCounts,
  ZoneWithLocations,
  Zone,
  Location,
  Dock,
  CreateWarehousePayload,
  UpdateWarehousePayload,
  CreateZonePayload,
  UpdateZonePayload,
  CreateLocationPayload,
  UpdateLocationPayload,
  CreateDockPayload,
  UpdateDockPayload
} from './types';

// ─── Warehouses ──────────────────────────────────────────────────────────────

export async function listWarehouses(
  filters: WarehouseFilters
): Promise<{ data: WarehouseWithCounts[]; total: number }> {
  const { orgId } = await requireOrgContext();
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;

  const where = and(
    eq(warehouses.orgId, orgId),
    filters.search
      ? or(
          ilike(warehouses.name, `%${filters.search}%`),
          ilike(warehouses.code, `%${filters.search}%`)
        )
      : undefined
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: warehouses.id,
        orgId: warehouses.orgId,
        name: warehouses.name,
        code: warehouses.code,
        address: warehouses.address,
        lat: warehouses.lat,
        lng: warehouses.lng,
        createdAt: warehouses.createdAt,
        updatedAt: warehouses.updatedAt,
        zoneCount: sql<number>`(select count(*) from zones where zones.warehouse_id = ${warehouses.id})::int`,
        locationCount: sql<number>`(select count(*) from locations where locations.warehouse_id = ${warehouses.id})::int`,
        dockCount: sql<number>`(select count(*) from docks where docks.warehouse_id = ${warehouses.id})::int`
      })
      .from(warehouses)
      .where(where)
      .orderBy(asc(warehouses.code))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(warehouses).where(where)
  ]);

  return { data: rows, total };
}

export async function getWarehouse(id: string): Promise<WarehouseWithCounts | null> {
  const { orgId } = await requireOrgContext();
  const rows = await db
    .select({
      id: warehouses.id,
      orgId: warehouses.orgId,
      name: warehouses.name,
      code: warehouses.code,
      address: warehouses.address,
      lat: warehouses.lat,
      lng: warehouses.lng,
      createdAt: warehouses.createdAt,
      updatedAt: warehouses.updatedAt,
      zoneCount: sql<number>`(select count(*) from zones where zones.warehouse_id = ${warehouses.id})::int`,
      locationCount: sql<number>`(select count(*) from locations where locations.warehouse_id = ${warehouses.id})::int`,
      dockCount: sql<number>`(select count(*) from docks where docks.warehouse_id = ${warehouses.id})::int`
    })
    .from(warehouses)
    .where(and(eq(warehouses.id, id), eq(warehouses.orgId, orgId)));
  return rows[0] ?? null;
}

export async function createWarehouse(payload: CreateWarehousePayload): Promise<{ id: string }> {
  const { orgId } = await requireOrgContext();
  const [row] = await db
    .insert(warehouses)
    .values({ ...payload, orgId })
    .returning({ id: warehouses.id });
  return row;
}

export async function updateWarehouse(payload: UpdateWarehousePayload): Promise<void> {
  const { orgId } = await requireOrgContext();
  const { id, ...rest } = payload;
  await db
    .update(warehouses)
    .set({ ...rest, updatedAt: new Date() })
    .where(and(eq(warehouses.id, id), eq(warehouses.orgId, orgId)));
}

export async function deleteWarehouse(id: string): Promise<void> {
  const { orgId } = await requireOrgContext();
  await db.delete(warehouses).where(and(eq(warehouses.id, id), eq(warehouses.orgId, orgId)));
}

// ─── Zones ───────────────────────────────────────────────────────────────────

export async function listZones(warehouseId: string): Promise<ZoneWithLocations[]> {
  const { orgId } = await requireOrgContext();
  await assertWarehouseInOrg(orgId, warehouseId);

  return db
    .select({
      id: zones.id,
      orgId: zones.orgId,
      warehouseId: zones.warehouseId,
      name: zones.name,
      code: zones.code,
      createdAt: zones.createdAt,
      updatedAt: zones.updatedAt,
      locationCount: sql<number>`(select count(*) from locations where locations.zone_id = ${zones.id})::int`
    })
    .from(zones)
    .where(and(eq(zones.orgId, orgId), eq(zones.warehouseId, warehouseId)))
    .orderBy(asc(zones.code));
}

export async function createZone(payload: CreateZonePayload): Promise<{ id: string }> {
  const { orgId } = await requireOrgContext();
  await assertWarehouseInOrg(orgId, payload.warehouseId);
  const [row] = await db
    .insert(zones)
    .values({ ...payload, orgId })
    .returning({ id: zones.id });
  return row;
}

export async function updateZone(payload: UpdateZonePayload): Promise<void> {
  const { orgId } = await requireOrgContext();
  const { id, ...rest } = payload;
  await db
    .update(zones)
    .set({ ...rest, updatedAt: new Date() })
    .where(and(eq(zones.id, id), eq(zones.orgId, orgId)));
}

export async function deleteZone(id: string): Promise<void> {
  const { orgId } = await requireOrgContext();
  await db.delete(zones).where(and(eq(zones.id, id), eq(zones.orgId, orgId)));
}

// ─── Locations ───────────────────────────────────────────────────────────────

export async function listLocations(warehouseId: string): Promise<Location[]> {
  const { orgId } = await requireOrgContext();
  await assertWarehouseInOrg(orgId, warehouseId);

  return db
    .select()
    .from(locations)
    .where(and(eq(locations.orgId, orgId), eq(locations.warehouseId, warehouseId)))
    .orderBy(asc(locations.code));
}

export async function createLocation(payload: CreateLocationPayload): Promise<{ id: string }> {
  const { orgId } = await requireOrgContext();
  await assertWarehouseInOrg(orgId, payload.warehouseId);
  const [row] = await db
    .insert(locations)
    .values({ ...payload, orgId })
    .returning({ id: locations.id });
  return row;
}

export async function updateLocation(payload: UpdateLocationPayload): Promise<void> {
  const { orgId } = await requireOrgContext();
  const { id, ...rest } = payload;
  await db
    .update(locations)
    .set({ ...rest, updatedAt: new Date() })
    .where(and(eq(locations.id, id), eq(locations.orgId, orgId)));
}

export async function deleteLocation(id: string): Promise<void> {
  const { orgId } = await requireOrgContext();
  await db.delete(locations).where(and(eq(locations.id, id), eq(locations.orgId, orgId)));
}

// ─── Docks ───────────────────────────────────────────────────────────────────

export async function listDocks(warehouseId: string): Promise<Dock[]> {
  const { orgId } = await requireOrgContext();
  await assertWarehouseInOrg(orgId, warehouseId);

  return db
    .select()
    .from(docks)
    .where(and(eq(docks.orgId, orgId), eq(docks.warehouseId, warehouseId)))
    .orderBy(asc(docks.code));
}

export async function createDock(payload: CreateDockPayload): Promise<{ id: string }> {
  const { orgId } = await requireOrgContext();
  await assertWarehouseInOrg(orgId, payload.warehouseId);
  const [row] = await db
    .insert(docks)
    .values({ ...payload, orgId })
    .returning({ id: docks.id });
  return row;
}

export async function updateDock(payload: UpdateDockPayload): Promise<void> {
  const { orgId } = await requireOrgContext();
  const { id, ...rest } = payload;
  await db
    .update(docks)
    .set({ ...rest, updatedAt: new Date() })
    .where(and(eq(docks.id, id), eq(docks.orgId, orgId)));
}

export async function deleteDock(id: string): Promise<void> {
  const { orgId } = await requireOrgContext();
  await db.delete(docks).where(and(eq(docks.id, id), eq(docks.orgId, orgId)));
}
