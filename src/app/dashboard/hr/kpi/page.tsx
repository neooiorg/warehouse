import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import PageContainer from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { kpiTemplatesQueryOptions } from '@/features/hr/api/queries';
import { KpiTemplateTable } from '@/features/hr/components/kpi-template-table';

export const metadata = { title: 'Dashboard: Đề xuất KPI' };

export default async function Page() {
  const qc = getQueryClient();
  void qc.prefetchQuery(kpiTemplatesQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <PageContainer
        pageTitle='Đề xuất KPI'
        pageDescription='Thiết lập và quản lý KPI theo vai trò nhân sự. Công thức tính và mục tiêu cho từng chỉ số.'
      >
        <Suspense fallback={<Skeleton className='h-96' />}>
          <KpiTemplateTable />
        </Suspense>
      </PageContainer>
    </HydrationBoundary>
  );
}
