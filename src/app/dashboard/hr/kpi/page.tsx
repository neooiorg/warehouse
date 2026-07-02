import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { hrKpiOptions } from '@/features/hr/api/queries';
import HrKpiDashboard from '@/features/hr/components/hr-kpi-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Dashboard: KPI Nhân sự' };

function KpiSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-28 rounded-lg' />
        ))}
      </div>
      <Skeleton className='h-64 rounded-lg' />
    </div>
  );
}

export default async function HrKpiPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(hrKpiOptions());

  return (
    <PageContainer
      pageTitle='KPI Nhân sự'
      pageDescription='Tỷ lệ nghỉ việc, gắn bó trung bình và biến động headcount 12 tháng'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<KpiSkeleton />}>
          <HrKpiDashboard />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
