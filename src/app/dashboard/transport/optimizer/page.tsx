import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import PageContainer from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { productSkuOptionsQuery } from '@/features/master-data/api/queries';
import { TransportOptimizerClient } from '@/features/transport/components/transport-optimizer-client';

export const metadata = { title: 'Quản lý kho: Tìm kho nguồn' };

export default async function Page() {
  const qc = getQueryClient();
  void qc.prefetchQuery(productSkuOptionsQuery());

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <PageContainer
        pageTitle='Tối ưu vận chuyển'
        pageDescription='Tìm kho có tồn kho và gần điểm đích nhất. Tính toán khoảng cách và thời gian vận chuyển ước tính.'
      >
        <Suspense fallback={<Skeleton className='h-96' />}>
          <TransportOptimizerClient />
        </Suspense>
      </PageContainer>
    </HydrationBoundary>
  );
}
