import { pgTable, text, uuid, date, index, pgEnum } from 'drizzle-orm/pg-core';
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
