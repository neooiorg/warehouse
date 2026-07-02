import { pgTable, text, uuid, doublePrecision, index } from 'drizzle-orm/pg-core';
import { timestamps } from './common';
import { warehouses } from './warehouse';

export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    plateNumber: text('plate_number').notNull(),
    type: text('type'),
    capacityWeight: doublePrecision('capacity_weight'),
    capacityVolume: doublePrecision('capacity_volume'),
    homeWarehouseId: uuid('home_warehouse_id').references(() => warehouses.id, {
      onDelete: 'set null'
    }),
    ...timestamps
  },
  (table) => [
    index('vehicles_org_id_idx').on(table.orgId),
    index('vehicles_home_warehouse_id_idx').on(table.homeWarehouseId)
  ]
);
