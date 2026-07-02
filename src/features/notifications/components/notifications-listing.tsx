import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { notificationsQueryOptions } from '../api/queries';
import NotificationsPage from './notifications-page';

export default function NotificationsListingPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(notificationsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotificationsPage />
    </HydrationBoundary>
  );
}
