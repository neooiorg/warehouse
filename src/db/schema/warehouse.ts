import {
  pgTable,
  text,
  uuid,
  doublePrecision,
  integer,
  index,
  uniqueIndex,
  pgEnum
} from 'drizzle-orm/pg-core';
import { timestamps } from './common';

export const dockDirectionEnum = pgEnum('dock_direction', ['inbound', 'outbound', 'both']);

export const locationTypeEnum = pgEnum('location_type', ['floor', 'rack']);

export const warehouses = pgTable(
  'warehouses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    name: text('name').notNull(),
    code: text('code').notNull(),
    address: text('address'),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    ...timestamps
  },
  (table) => [
    index('warehouses_org_id_idx').on(table.orgId),
    uniqueIndex('warehouses_org_code_idx').on(table.orgId, table.code)
  ]
);

export const zones = pgTable(
  'zones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    code: text('code').notNull(),
    ...timestamps
  },
  (table) => [
    index('zones_org_id_idx').on(table.orgId),
    index('zones_warehouse_id_idx').on(table.warehouseId)
  ]
);

export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    zoneId: uuid('zone_id').references(() => zones.id, {
      onDelete: 'set null'
    }),
    code: text('code').notNull(),
    type: locationTypeEnum('type').notNull().default('rack'),
    level: integer('level'),
    capacityVolume: doublePrecision('capacity_volume'),
    capacityWeight: doublePrecision('capacity_weight'),
    // Precomputed proximity used by the slotting optimizer to rank locations
    // by how quickly stock stored there can reach a dock door.
    distanceToDock: doublePrecision('distance_to_dock'),
    ...timestamps
  },
  (table) => [
    index('locations_org_id_idx').on(table.orgId),
    index('locations_warehouse_id_idx').on(table.warehouseId),
    index('locations_zone_id_idx').on(table.zoneId),
    uniqueIndex('locations_warehouse_code_idx').on(table.warehouseId, table.code)
  ]
);

export const docks = pgTable(
  'docks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    direction: dockDirectionEnum('direction').notNull().default('both'),
    ...timestamps
  },
  (table) => [
    index('docks_org_id_idx').on(table.orgId),
    index('docks_warehouse_id_idx').on(table.warehouseId),
    uniqueIndex('docks_warehouse_code_idx').on(table.warehouseId, table.code)
  ]
);
