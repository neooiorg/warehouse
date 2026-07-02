import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { markNotificationRead, markAllNotificationsRead, deleteNotification } from './service';
import { notificationKeys } from './queries';

export const markNotificationReadMutation = mutationOptions({
  mutationFn: (id: string) => markNotificationRead(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: notificationKeys.all });
  }
});

export const markAllNotificationsReadMutation = mutationOptions({
  mutationFn: () => markAllNotificationsRead(),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: notificationKeys.all });
  }
});

export const deleteNotificationMutation = mutationOptions({
  mutationFn: (id: string) => deleteNotification(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: notificationKeys.all });
  }
});
