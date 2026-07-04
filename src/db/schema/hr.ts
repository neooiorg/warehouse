import {
  pgTable,
  text,
  uuid,
  date,
  integer,
  real,
  boolean,
  jsonb,
  index,
  pgEnum
} from 'drizzle-orm/pg-core';
import { timestamps } from './common';
import { warehouses } from './warehouse';

export const employeeStatusEnum = pgEnum('employee_status', ['active', 'terminated', 'on_leave']);

export const staffingPlanStatusEnum = pgEnum('staffing_plan_status', ['draft', 'active']);

export const kpiTemplates = pgTable(
  'kpi_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    role: text('role').notNull(),
    kpiName: text('kpi_name').notNull(),
    formula: text('formula'),
    target: real('target'),
    unit: text('unit'),
    weight: real('weight').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps
  },
  (table) => [
    index('kpi_templates_org_id_idx').on(table.orgId),
    index('kpi_templates_role_idx').on(table.role)
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
    outputUnit: text('output_unit').notNull().default('qty'),
    standardRatePerHour: real('standard_rate_per_hour').notNull().default(1),
    kpiCategory: text('kpi_category').notNull().default('throughput'),
    dependencies: jsonb('dependencies').$type<string[]>().notNull().default([]),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps
  },
  (table) => [index('workflow_tasks_org_id_idx').on(table.orgId)]
);

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

// Staffing plan groups a set of work_tasks into one scheduling run
export const staffingPlans = pgTable(
  'staffing_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    availableHeadcount: integer('available_headcount').notNull().default(1),
    status: staffingPlanStatusEnum('status').notNull().default('draft'),
    // Computed by AON scheduler, stored for display without re-running
    criticalPathHours: real('critical_path_hours'),
    ...timestamps
  },
  (table) => [
    index('staffing_plans_org_id_idx').on(table.orgId),
    index('staffing_plans_warehouse_id_idx').on(table.warehouseId)
  ]
);

// Individual tasks in a staffing plan (AON network nodes)
export const workTasks = pgTable(
  'work_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => staffingPlans.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    durationHours: real('duration_hours').notNull(),
    // Array of sibling task IDs this task depends on
    predecessorIds: jsonb('predecessor_ids').$type<string[]>().notNull().default([]),
    requiredHeadcount: integer('required_headcount').notNull().default(1),
    // Assigned employee IDs after resource leveling
    assignedEmployeeIds: jsonb('assigned_employee_ids').$type<string[]>().notNull().default([]),
    // Computed by scheduler (hours from plan start)
    earlyStart: real('early_start'),
    earlyFinish: real('early_finish'),
    lateStart: real('late_start'),
    lateFinish: real('late_finish'),
    totalFloat: real('total_float'),
    isCritical: integer('is_critical').notNull().default(0), // 0/1 boolean
    color: text('color'),
    ...timestamps
  },
  (table) => [
    index('work_tasks_org_id_idx').on(table.orgId),
    index('work_tasks_plan_id_idx').on(table.planId)
  ]
);
