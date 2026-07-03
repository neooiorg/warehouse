import {
  pgTable,
  text,
  uuid,
  doublePrecision,
  numeric,
  date,
  jsonb,
  index,
  pgEnum
} from 'drizzle-orm/pg-core';
import { timestamps } from './common';
import { warehouses } from './warehouse';

export const deliveryOrderStatusEnum = pgEnum('delivery_order_status', [
  'pending',
  'planned',
  'dispatched',
  'delivered',
  'cancelled'
]);

export const fuelTypeEnum = pgEnum('fuel_type', ['ron95', 'ron92', 'diesel', 'e5']);

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

// Daily fuel price log (crawled from external source or manually entered)
export const fuelPrices = pgTable(
  'fuel_prices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // null = global/Vietnam-wide price, non-null = org-specific override
    orgId: text('org_id'),
    fuelType: fuelTypeEnum('fuel_type').notNull(),
    pricePerLiter: numeric('price_per_liter', { precision: 10, scale: 2 }).notNull(),
    effectiveDate: date('effective_date').notNull(),
    source: text('source'),
    ...timestamps
  },
  (table) => [
    index('fuel_prices_fuel_type_idx').on(table.fuelType),
    index('fuel_prices_effective_date_idx').on(table.effectiveDate)
  ]
);

// Outbound delivery requests that need route planning
export const deliveryOrders = pgTable(
  'delivery_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),
    destination: text('destination').notNull(),
    destinationLat: doublePrecision('destination_lat'),
    destinationLng: doublePrecision('destination_lng'),
    // Array of { skuId, qty }
    requiredSkus: jsonb('required_skus')
      .$type<Array<{ skuId: string; qty: number }>>()
      .notNull()
      .default([]),
    preferredDate: date('preferred_date'),
    status: deliveryOrderStatusEnum('status').notNull().default('pending'),
    notes: text('notes'),
    ...timestamps
  },
  (table) => [
    index('delivery_orders_org_id_idx').on(table.orgId),
    index('delivery_orders_status_idx').on(table.status)
  ]
);

// Computed route plan for a delivery order
export const shipmentPlans = pgTable(
  'shipment_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => deliveryOrders.id, { onDelete: 'cascade' }),
    vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
    // Ordered array of warehouse IDs to pick from before final delivery
    routeWarehouseIds: jsonb('route_warehouse_ids').$type<string[]>().notNull().default([]),
    totalDistanceKm: doublePrecision('total_distance_km'),
    estimatedHours: doublePrecision('estimated_hours'),
    fuelCostEstimate: numeric('fuel_cost_estimate', { precision: 12, scale: 2 }),
    ...timestamps
  },
  (table) => [
    index('shipment_plans_org_id_idx').on(table.orgId),
    index('shipment_plans_order_id_idx').on(table.orderId)
  ]
);
