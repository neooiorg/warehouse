import { pgTable, text, uuid, doublePrecision, integer, date, index, pgEnum } from 'drizzle-orm/pg-core';
import { timestamps } from './common';
import { warehouses } from './warehouse';
import { productSkus } from './inventory';

export const shipmentStatusEnum = pgEnum('shipment_status', ['pending', 'fulfilled', 'cancelled']);
export const fuelTypeEnum = pgEnum('fuel_type', ['RON95', 'RON92', 'DO', 'DIESEL']);

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

export const shipmentRequests = pgTable(
  'shipment_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    skuId: uuid('sku_id').references(() => productSkus.id, { onDelete: 'set null' }),
    qtyRequired: doublePrecision('qty_required').notNull(),
    destinationLat: doublePrecision('destination_lat'),
    destinationLng: doublePrecision('destination_lng'),
    destinationAddress: text('destination_address'),
    requestDate: date('request_date').notNull(),
    status: shipmentStatusEnum('status').notNull().default('pending'),
    resolvedWarehouseId: uuid('resolved_warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),
    note: text('note'),
    ...timestamps
  },
  (table) => [
    index('shipment_requests_org_id_idx').on(table.orgId),
    index('shipment_requests_status_idx').on(table.status)
  ]
);

export const fuelPrices = pgTable(
  'fuel_prices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    region: text('region').notNull().default('national'),
    fuelType: fuelTypeEnum('fuel_type').notNull(),
    priceVnd: integer('price_vnd').notNull(),
    effectiveDate: date('effective_date').notNull(),
    source: text('source'),
    ...timestamps
  },
  (table) => [
    index('fuel_prices_fuel_type_idx').on(table.fuelType),
    index('fuel_prices_effective_date_idx').on(table.effectiveDate)
  ]
);
