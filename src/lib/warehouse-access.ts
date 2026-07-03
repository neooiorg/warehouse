import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { warehouses } from '@/db/schema';

export class WarehouseAccessError extends Error {
  constructor(message = 'Không tìm thấy kho trong tổ chức hiện tại') {
    super(message);
    this.name = 'WarehouseAccessError';
  }
}

// Confirms warehouseId belongs to orgId before a service.ts function acts on
// it, so a request can't read/write another organization's warehouse by
// guessing its id. Per-user, per-warehouse role restriction (e.g. an HR
// manager scoped to a single warehouse) has no source of truth yet — there is
// no WarehouseMembership table — so this only enforces org ownership today.
// Add a membership check here once that entity exists.
export async function assertWarehouseInOrg(orgId: string, warehouseId: string): Promise<void> {
  const [row] = await db
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(and(eq(warehouses.id, warehouseId), eq(warehouses.orgId, orgId)))
    .limit(1);

  if (!row) {
    throw new WarehouseAccessError();
  }
}
