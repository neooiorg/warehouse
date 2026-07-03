import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import PageContainer from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { TurnoverKpiCards } from '@/features/hr/components/turnover-kpi-cards';
import { TurnoverTrendChart } from '@/features/hr/components/turnover-trend-chart';
import { turnoverMetricsQueryOptions } from '@/features/hr/api/queries';

export const metadata = { title: 'Quản lý kho: Tổng quan nhân sự' };

export default async function Page() {
  const qc = getQueryClient();
  void qc.prefetchQuery(turnoverMetricsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <PageContainer
        pageTitle='Tổng quan Nhân sự'
        pageDescription='Theo dõi biến động nhân sự, tỷ lệ nghỉ việc và thời gian gắn bó trung bình.'
      >
        <div className='space-y-6'>
          <Suspense
            fallback={
              <div className='grid gap-4 md:grid-cols-4'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className='h-28' />
                ))}
              </div>
            }
          >
            <TurnoverKpiCards />
          </Suspense>
          <Suspense fallback={<Skeleton className='h-72' />}>
            <TurnoverTrendChart />
          </Suspense>
        </div>
      </PageContainer>
    </HydrationBoundary>
  );
}
