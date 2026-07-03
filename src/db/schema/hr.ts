import { pgTable, text, uuid, date, integer, doublePrecision, boolean, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { timestamps } from './common';
import { warehouses } from './warehouse';

export const employeeStatusEnum = pgEnum('employee_status', ['active', 'terminated', 'on_leave']);

export const employees = pgTable(
  'employees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    warehouseId: uuid('warehouse_id').references(() => warehouses.id, {
      onDelete: 'set null'
    }),
    fullName: text('full_name').notNull(),
    role: text('role'),
    department: text('department'),
    hireDate: date('hire_date').notNull(),
    terminationDate: date('termination_date'),
    status: employeeStatusEnum('status').notNull().default('active'),
    ...timestamps
  },
  (table) => [
    index('employees_org_id_idx').on(table.orgId),
    index('employees_warehouse_id_idx').on(table.warehouseId),
    index('employees_status_idx').on(table.status)
  ]
);

export const workflowTasks = pgTable(
  'workflow_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    name: text('name').notNull(),
    estimatedMinutes: integer('estimated_minutes').notNull().default(0),
    requiredRole: text('required_role'),
    dependencies: jsonb('dependencies').$type<string[]>().notNull().default([]),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps
  },
  (table) => [index('workflow_tasks_org_id_idx').on(table.orgId)]
);

export const staffingPlans = pgTable(
  'staffing_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),
    planDate: date('plan_date').notNull(),
    dailyVolume: integer('daily_volume').notNull().default(0),
    workHoursPerShift: doublePrecision('work_hours_per_shift').notNull().default(8),
    inputJson: jsonb('input_json').notNull().default({}),
    resultJson: jsonb('result_json').notNull().default({}),
    ...timestamps
  },
  (table) => [
    index('staffing_plans_org_id_idx').on(table.orgId),
    index('staffing_plans_warehouse_id_idx').on(table.warehouseId)
  ]
);

export const kpiTemplates = pgTable(
  'kpi_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    role: text('role').notNull(),
    kpiName: text('kpi_name').notNull(),
    formula: text('formula'),
    target: doublePrecision('target'),
    unit: text('unit'),
    weight: doublePrecision('weight').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps
  },
  (table) => [
    index('kpi_templates_org_id_idx').on(table.orgId),
    index('kpi_templates_role_idx').on(table.role)
  ]
);
