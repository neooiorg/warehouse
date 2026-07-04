'use server';

import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { warehouses, locations, productSkus, employees } from '@/db/schema';
import { requireOrgContext } from '@/lib/auth-context';
import type { WarehouseOption, LocationOption, ProductSkuOption, EmployeeOption } from './types';

export async function getWarehouseOptions(): Promise<WarehouseOption[]> {
  const { orgId } = await requireOrgContext();
  return db
    .select({ id: warehouses.id, code: warehouses.code, name: warehouses.name })
    .from(warehouses)
    .where(eq(warehouses.orgId, orgId))
    .orderBy(asc(warehouses.code));
}

export async function getLocationOptions(warehouseId: string): Promise<LocationOption[]> {
  const { orgId } = await requireOrgContext();
  return db
    .select({ id: locations.id, code: locations.code, type: locations.type })
    .from(locations)
    .where(and(eq(locations.orgId, orgId), eq(locations.warehouseId, warehouseId)))
    .orderBy(asc(locations.code));
}

export async function getProductSkuOptions(): Promise<ProductSkuOption[]> {
  const { orgId } = await requireOrgContext();
  return db
    .select({
      id: productSkus.id,
      sku: productSkus.sku,
      name: productSkus.name,
      unit: productSkus.unit,
      weight: productSkus.weight,
      allocationSortField: productSkus.allocationSortField,
      allocationSortDirection: productSkus.allocationSortDirection
    })
    .from(productSkus)
    .where(eq(productSkus.orgId, orgId))
    .orderBy(asc(productSkus.sku));
}

export async function getEmployeeOptions(): Promise<EmployeeOption[]> {
  const { orgId } = await requireOrgContext();
  return db
    .select({ id: employees.id, fullName: employees.fullName, role: employees.role })
    .from(employees)
    .where(eq(employees.orgId, orgId))
    .orderBy(asc(employees.fullName));
}
