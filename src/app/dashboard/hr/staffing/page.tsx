import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { staffingPlanListOptions } from '@/features/hr/api/queries';
import StaffingPlanner from '@/features/hr/components/staffing-planner';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Dashboard: Định biên nhân sự' };

export default async function HrStaffingPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(staffingPlanListOptions());

  return (
    <PageContainer
      pageTitle='Định biên nhân sự (AON/CPM)'
      pageDescription='Nhập đầu việc, chạy lịch Critical Path, xuất sơ đồ Gantt và đề xuất KPI'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Skeleton className='h-96 rounded-lg' />}>
          <StaffingPlanner />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
