import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import PageContainer from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { workflowTasksQueryOptions } from '@/features/hr/api/queries';
import { StaffingPageClient } from '@/features/hr/components/staffing-page-client';

export const metadata = { title: 'Dashboard: Định biên & Gantt' };

export default async function Page() {
  const qc = getQueryClient();
  void qc.prefetchQuery(workflowTasksQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <PageContainer
        pageTitle='Tính định biên nhân sự'
        pageDescription='Thiết lập đầu việc và tự động tính số lượng nhân sự cần thiết theo phương pháp AON. Sơ đồ Gantt hiển thị critical path.'
      >
        <Suspense fallback={<Skeleton className='h-96' />}>
          <StaffingPageClient />
        </Suspense>
      </PageContainer>
    </HydrationBoundary>
  );
}
