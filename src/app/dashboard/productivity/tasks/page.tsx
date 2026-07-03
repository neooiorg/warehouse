import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import PageContainer from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { productivityScoresQueryOptions } from '@/features/productivity/api/queries';
import { workflowTasksQueryOptions } from '@/features/hr/api/queries';
import { employeeOptionsQuery } from '@/features/master-data/api/queries';
import { ProductivityScoreTable } from '@/features/productivity/components/productivity-score-table';
import { TaskLogSheet } from '@/features/productivity/components/task-log-sheet';

export const metadata = { title: 'Quản lý kho: Năng suất' };

export default async function Page() {
  const qc = getQueryClient();
  await Promise.all([
    qc.prefetchQuery(productivityScoresQueryOptions()),
    qc.prefetchQuery(workflowTasksQueryOptions()),
    qc.prefetchQuery(employeeOptionsQuery())
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <PageContainer
        pageTitle='Đầu việc & Năng suất'
        pageDescription='Ghi nhận thời gian hoàn thành đầu việc và tính năng suất theo nhân viên.'
        pageHeaderAction={
          <Suspense>
            <TaskLogSheet />
          </Suspense>
        }
      >
        <Suspense fallback={<Skeleton className='h-64' />}>
          <ProductivityScoreTable />
        </Suspense>
      </PageContainer>
    </HydrationBoundary>
  );
}
