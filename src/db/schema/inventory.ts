import {
  pgTable,
  text,
  uuid,
  date,
  doublePrecision,
  timestamp,
  index,
  uniqueIndex,
  pgEnum
} from 'drizzle-orm/pg-core';
import { timestamps } from './common';
import { warehouses, locations } from './warehouse';
import { employees } from './hr';

// Which date column the allocation engine sorts lots by when picking stock
// for an outbound order.
export const lotSortFieldEnum = pgEnum('lot_sort_field', ['received_date', 'expiry_date']);

export const sortDirectionEnum = pgEnum('sort_direction', ['asc', 'desc']);

// storageClassLabel is just a display preset (FIFO/FEFO/LEFO/Custom); the
// actual picking behavior is driven entirely by allocationSortField +
// allocationSortDirection so LEFO (and any other rule) stays admin-configurable
// per SKU rather than hardcoded — see src/features/inventory/utils/allocation.ts.
export const productSkus = pgTable(
  'product_skus',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    sku: text('sku').notNull(),
    name: text('name').notNull(),
    category: text('category'),
    unit: text('unit').notNull().default('unit'),
    weight: doublePrecision('weight'),
    volume: doublePrecision('volume'),
    storageClassLabel: text('storage_class_label').notNull().default('FIFO'),
    allocationSortField: lotSortFieldEnum('allocation_sort_field')
      .notNull()
      .default('received_date'),
    allocationSortDirection: sortDirectionEnum('allocation_sort_direction')
      .notNull()
      .default('asc'),
    ...timestamps
  },
  (table) => [
    index('product_skus_org_id_idx').on(table.orgId),
    uniqueIndex('product_skus_org_sku_idx').on(table.orgId, table.sku)
  ]
);

export const inventoryLotStatusEnum = pgEnum('inventory_lot_status', [
  'available',
  'reserved',
  'depleted',
  'damaged'
]);

// A lot is one receipt of a SKU with its own received/expiry dates — the
// allocation engine picks across a SKU's lots using ProductSku's configured
// sort rule, never across SKUs.
export const inventoryLots = pgTable(
  'inventory_lots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    skuId: uuid('sku_id')
      .notNull()
      .references(() => productSkus.id, { onDelete: 'restrict' }),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'restrict' }),
    locationId: uuid('location_id').references(() => locations.id, {
      onDelete: 'set null'
    }),
    lotNo: text('lot_no').notNull(),
    qty: doublePrecision('qty').notNull(),
    receivedDate: date('received_date').notNull(),
    expiryDate: date('expiry_date'),
    status: inventoryLotStatusEnum('status').notNull().default('available'),
    ...timestamps
  },
  (table) => [
    index('inventory_lots_org_id_idx').on(table.orgId),
    index('inventory_lots_sku_id_idx').on(table.skuId),
    index('inventory_lots_warehouse_id_idx').on(table.warehouseId),
    index('inventory_lots_location_id_idx').on(table.locationId),
    index('inventory_lots_status_idx').on(table.status)
  ]
);

export const inventoryTransactionTypeEnum = pgEnum('inventory_transaction_type', [
  'inbound',
  'outbound',
  'transfer',
  'adjustment'
]);

// Append-only ledger — every stock movement is one row here. This is what
// makes lot/location traceability answerable without ambiguous joins: given
// a lot or a location, its full chain of custody is just this table filtered
// and ordered by occurredAt.
//
// dockAppointmentId and workLogId (linking a movement to the dock visit or
// task execution that produced it) aren't columns yet because DockAppointment
// (Phase 5) and WorkLog (Phase 3/4) don't exist — added via a later migration
// once those tables land, not stubbed out now.
export const inventoryTransactions = pgTable(
  'inventory_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'restrict' }),
    type: inventoryTransactionTypeEnum('type').notNull(),
    skuId: uuid('sku_id')
      .notNull()
      .references(() => productSkus.id, { onDelete: 'restrict' }),
    lotId: uuid('lot_id').references(() => inventoryLots.id, {
      onDelete: 'set null'
    }),
    qty: doublePrecision('qty').notNull(),
    fromLocationId: uuid('from_location_id').references(() => locations.id, {
      onDelete: 'set null'
    }),
    toLocationId: uuid('to_location_id').references(() => locations.id, {
      onDelete: 'set null'
    }),
    performedBy: uuid('performed_by').references(() => employees.id, {
      onDelete: 'set null'
    }),
    note: text('note'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    ...timestamps
  },
  (table) => [
    index('inventory_transactions_org_id_idx').on(table.orgId),
    index('inventory_transactions_warehouse_id_idx').on(table.warehouseId),
    index('inventory_transactions_sku_id_idx').on(table.skuId),
    index('inventory_transactions_lot_id_idx').on(table.lotId),
    index('inventory_transactions_occurred_at_idx').on(table.occurredAt)
  ]
);
