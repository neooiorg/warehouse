import { queryOptions } from '@tanstack/react-query';
import { getNotifications } from './service';

export type { Notification } from './types';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const
};

export const notificationsQueryOptions = () =>
  queryOptions({
    queryKey: notificationKeys.list(),
    queryFn: () => getNotifications(),
    refetchInterval: 60 * 1000
  });
