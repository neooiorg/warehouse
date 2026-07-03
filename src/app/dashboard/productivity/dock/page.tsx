import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import PageContainer from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { warehouseOptionsQuery } from '@/features/master-data/api/queries';
import { DockPageClient } from '@/features/productivity/components/dock-page-client';

export const metadata = { title: 'Dashboard: Lịch cửa Dock' };

export default async function Page() {
  const qc = getQueryClient();
  void qc.prefetchQuery(warehouseOptionsQuery());

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <PageContainer
        pageTitle='Tối ưu lịch cửa Dock'
        pageDescription='Nhập danh sách xe và thông số xe nâng. Hệ thống tự động phân bổ xe vào cửa dock tối ưu nhất.'
      >
        <Suspense fallback={<Skeleton className='h-96' />}>
          <DockPageClient />
        </Suspense>
      </PageContainer>
    </HydrationBoundary>
  );
}
