import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { deliveryOrdersOptions } from '@/features/transport/api/queries';
import TransportPlanner from '@/features/transport/components/transport-planner';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Dashboard: Lập kế hoạch vận chuyển' };

export default async function TransportPlanningPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(deliveryOrdersOptions());

  return (
    <PageContainer
      pageTitle='Lập kế hoạch vận chuyển'
      pageDescription='Tạo đơn giao hàng và tối ưu tuyến đường theo Haversine + TSP heuristic'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Skeleton className='h-96 rounded-lg' />}>
          <TransportPlanner />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
