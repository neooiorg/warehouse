'use server';

import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { requireOrgContext } from '@/lib/auth-context';
import type { CreateNotificationPayload, Notification } from './types';

export async function getNotifications(): Promise<Notification[]> {
  const { orgId, userId } = await requireOrgContext();

  return db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.orgId, orgId),
        or(isNull(notifications.targetUserId), eq(notifications.targetUserId, userId))
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(100);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { orgId } = await requireOrgContext();

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.orgId, orgId)));
}

export async function markAllNotificationsRead(): Promise<void> {
  const { orgId, userId } = await requireOrgContext();

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.orgId, orgId),
        or(isNull(notifications.targetUserId), eq(notifications.targetUserId, userId)),
        isNull(notifications.readAt)
      )
    );
}

export async function deleteNotification(id: string): Promise<void> {
  const { orgId } = await requireOrgContext();

  await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.orgId, orgId)));
}

// Called by cron jobs and other feature modules (daily re-slotting, fuel-price
// scrape failures, staffing alerts, etc.) to emit a notification. Those
// callers already resolve orgId themselves (e.g. iterating every org with a
// cron secret), so this intentionally does not go through requireOrgContext.
export async function createNotification(
  orgId: string,
  data: CreateNotificationPayload
): Promise<void> {
  await db.insert(notifications).values({
    orgId,
    warehouseId: data.warehouseId ?? null,
    targetUserId: data.targetUserId ?? null,
    sourceType: data.sourceType,
    title: data.title,
    body: data.body
  });
}
