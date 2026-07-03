import {
  pgTable,
  text,
  uuid,
  doublePrecision,
  integer,
  real,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  pgEnum
} from 'drizzle-orm/pg-core';
import { timestamps } from './common';

export const dockDirectionEnum = pgEnum('dock_direction', ['inbound', 'outbound', 'both']);

export const locationTypeEnum = pgEnum('location_type', ['floor', 'rack']);

export const dockAppointmentStatusEnum = pgEnum('dock_appointment_status', [
  'scheduled',
  'in_progress',
  'done',
  'cancelled'
]);

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
    zoneId: uuid('zone_id').references(() => zones.id, { onDelete: 'set null' }),
    code: text('code').notNull(),
    type: locationTypeEnum('type').notNull().default('rack'),
    level: integer('level'),
    capacityVolume: doublePrecision('capacity_volume'),
    capacityWeight: doublePrecision('capacity_weight'),
    distanceToDock: doublePrecision('distance_to_dock'),
    // 2D floor plan editor position (grid units)
    posX: integer('pos_x'),
    posY: integer('pos_y'),
    posWidth: integer('pos_width'),
    posHeight: integer('pos_height'),
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

// Scheduled vehicle appointments at dock doors
export const dockAppointments = pgTable(
  'dock_appointments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    dockId: uuid('dock_id')
      .notNull()
      .references(() => docks.id, { onDelete: 'cascade' }),
    // vehicleId references transport.vehicles — no FK here to avoid circular schema import
    vehicleId: uuid('vehicle_id'),
    direction: dockDirectionEnum('direction').notNull(),
    palletCount: integer('pallet_count'),
    scheduledStart: timestamp('scheduled_start', { withTimezone: true }).notNull(),
    scheduledEnd: timestamp('scheduled_end', { withTimezone: true }).notNull(),
    actualStart: timestamp('actual_start', { withTimezone: true }),
    actualEnd: timestamp('actual_end', { withTimezone: true }),
    status: dockAppointmentStatusEnum('status').notNull().default('scheduled'),
    processingNotes: text('processing_notes'),
    ...timestamps
  },
  (table) => [
    index('dock_appointments_org_id_idx').on(table.orgId),
    index('dock_appointments_warehouse_id_idx').on(table.warehouseId),
    index('dock_appointments_dock_id_idx').on(table.dockId),
    index('dock_appointments_scheduled_start_idx').on(table.scheduledStart)
  ]
);

// Forklift capacity config per warehouse (used by dock optimizer)
export const forkliftConfigs = pgTable('forklift_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(),
  warehouseId: uuid('warehouse_id')
    .notNull()
    .references(() => warehouses.id, { onDelete: 'cascade' }),
  qty: integer('qty').notNull().default(1),
  avgMinutesPerPallet: real('avg_minutes_per_pallet').notNull().default(5),
  ...timestamps
});

// Persisted slotting optimizer runs (daily reslotting history)
export const slottingRuns = pgTable(
  'slotting_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    runAt: timestamp('run_at', { withTimezone: true }).notNull().defaultNow(),
    movedCount: integer('moved_count').notNull().default(0),
    // Array of { lotId, fromLocationId, toLocationId, reason }
    recommendations: jsonb('recommendations')
      .$type<
        Array<{
          lotId: string;
          fromLocationId: string | null;
          toLocationId: string;
          reason: string;
        }>
      >()
      .notNull()
      .default([]),
    ...timestamps
  },
  (table) => [
    index('slotting_runs_org_id_idx').on(table.orgId),
    index('slotting_runs_warehouse_id_idx').on(table.warehouseId),
    index('slotting_runs_run_at_idx').on(table.runAt)
  ]
);
