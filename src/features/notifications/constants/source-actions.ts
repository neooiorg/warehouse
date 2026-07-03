import type { NotificationAction } from '@/components/ui/notification-card';
import type { NotificationSourceType } from '../api/types';

// Each source type gets one primary redirect action pointing at the feature
// page a user would act on. Routes point at modules that don't exist yet
// (inventory, staffing, transportation) — update as those phases ship.
export const sourceActionRoutes: Record<NotificationSourceType, string> = {
  reslotting: '/dashboard/inventory',
  fuel_price: '/dashboard/transportation',
  staffing: '/dashboard/staffing',
  transportation: '/dashboard/transportation',
  system: '/dashboard/overview'
};

export const sourceActionLabels: Record<NotificationSourceType, string> = {
  reslotting: 'Xem đề xuất',
  fuel_price: 'Xem giá',
  staffing: 'Xem định biên',
  transportation: 'Xem vận chuyển',
  system: 'Xem'
};

export function getActionsForSource(sourceType: NotificationSourceType): NotificationAction[] {
  return [
    {
      id: sourceType,
      label: sourceActionLabels[sourceType],
      type: 'redirect',
      style: 'primary'
    }
  ];
}
