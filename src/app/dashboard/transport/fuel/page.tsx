import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import PageContainer from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { fuelPricesQueryOptions } from '@/features/transport/api/queries';
import { FuelPriceClient } from '@/features/transport/components/fuel-price-client';

export const metadata = { title: 'Dashboard: Giá xăng dầu' };

export default async function Page() {
  const qc = getQueryClient();
  void qc.prefetchQuery(fuelPricesQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <PageContainer
        pageTitle='Giá xăng dầu'
        pageDescription='Theo dõi giá xăng dầu cập nhật hàng ngày. Cron job tự động lấy từ Petrolimex.'
      >
        <Suspense fallback={<Skeleton className='h-96' />}>
          <FuelPriceClient />
        </Suspense>
      </PageContainer>
    </HydrationBoundary>
  );
}
