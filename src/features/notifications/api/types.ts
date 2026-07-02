import type { notifications } from '@/db/schema';

export type Notification = typeof notifications.$inferSelect;
export type NotificationSourceType = Notification['sourceType'];

export type CreateNotificationPayload = {
  warehouseId?: string | null;
  targetUserId?: string | null;
  sourceType: NotificationSourceType;
  title: string;
  body?: string;
};
