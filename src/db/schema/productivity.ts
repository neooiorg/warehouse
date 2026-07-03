import { pgTable, text, uuid, integer, doublePrecision, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { timestamps } from './common';
import { warehouses } from './warehouse';
import { employees, workflowTasks } from './hr';

export const taskLogs = pgTable(
  'task_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),
    employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'set null' }),
    taskTypeId: uuid('task_type_id').references(() => workflowTasks.id, { onDelete: 'set null' }),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    qty: doublePrecision('qty').notNull().default(0),
    unit: text('unit'),
    note: text('note'),
    ...timestamps
  },
  (table) => [
    index('task_logs_org_id_idx').on(table.orgId),
    index('task_logs_employee_id_idx').on(table.employeeId),
    index('task_logs_warehouse_id_idx').on(table.warehouseId)
  ]
);

export const dockSchedules = pgTable(
  'dock_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),
    scheduleDate: text('schedule_date').notNull(),
    forkliftsCount: integer('forklifts_count').notNull().default(1),
    minutesPerPallet: doublePrecision('minutes_per_pallet').notNull().default(5),
    inputJson: jsonb('input_json').notNull().default([]),
    resultJson: jsonb('result_json').notNull().default([]),
    ...timestamps
  },
  (table) => [
    index('dock_schedules_org_id_idx').on(table.orgId),
    index('dock_schedules_warehouse_id_idx').on(table.warehouseId)
  ]
);
