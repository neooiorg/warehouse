import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import PageContainer from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { warehouseOptionsQuery } from '@/features/master-data/api/queries';
import { StorageOptimizeClient } from '@/features/inventory/components/storage-optimize-client';

export const metadata = { title: 'Quản lý kho: Tối ưu kho' };

export default async function Page() {
  const qc = getQueryClient();
  void qc.prefetchQuery(warehouseOptionsQuery());

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <PageContainer
        pageTitle='Tối ưu lưu trữ kho'
        pageDescription='Phân tích vị trí hàng hóa theo quy tắc FIFO/FEFO/LEFO và đề xuất đảo vị trí. Tìm kiếm lịch sử kiện hàng.'
      >
        <Suspense fallback={<Skeleton className='h-96' />}>
          <StorageOptimizeClient />
        </Suspense>
      </PageContainer>
    </HydrationBoundary>
  );
}
