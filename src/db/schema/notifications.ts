import { pgTable, text, uuid, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { timestamps } from './common';
import { warehouses } from './warehouse';

export const notificationSourceEnum = pgEnum('notification_source', [
  'reslotting',
  'fuel_price',
  'staffing',
  'transportation',
  'system'
]);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: text('org_id').notNull(),
    warehouseId: uuid('warehouse_id').references(() => warehouses.id, {
      onDelete: 'cascade'
    }),
    // Clerk user id; null means broadcast to everyone in the org with access
    // to warehouseId (or the whole org if warehouseId is also null).
    targetUserId: text('target_user_id'),
    sourceType: notificationSourceEnum('source_type').notNull().default('system'),
    title: text('title').notNull(),
    body: text('body'),
    readAt: timestamp('read_at', { withTimezone: true }),
    ...timestamps
  },
  (table) => [
    index('notifications_org_id_idx').on(table.orgId),
    index('notifications_target_user_id_idx').on(table.targetUserId),
    index('notifications_warehouse_id_idx').on(table.warehouseId)
  ]
);
