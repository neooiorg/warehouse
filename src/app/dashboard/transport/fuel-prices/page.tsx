import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { fuelPricesOptions } from '@/features/transport/api/queries';
import FuelPriceView from '@/features/transport/components/fuel-price-view';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Quản lý kho: Giá xăng dầu' };

export default async function FuelPricesPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(fuelPricesOptions());

  return (
    <PageContainer
      pageTitle='Giá xăng dầu'
      pageDescription='Theo dõi biến động giá xăng dầu và cập nhật thủ công khi cần'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Skeleton className='h-96 rounded-lg' />}>
          <FuelPriceView />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
