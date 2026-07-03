import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { productivitySummaryOptions } from '@/features/productivity/api/queries';
import ProductivityDashboard from '@/features/productivity/components/productivity-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Quản lý kho: Năng suất nhân viên' };

export default async function ProductivityPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(productivitySummaryOptions(30));

  return (
    <PageContainer
      pageTitle='Năng suất nhân viên'
      pageDescription='Thống kê năng suất xử lý hàng hóa theo nhân viên trong 30 ngày'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Skeleton className='h-96 rounded-lg' />}>
          <ProductivityDashboard />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
