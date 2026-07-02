import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import DockSchedulingWrapper from './dock-scheduling-wrapper';

export const metadata = { title: 'Dashboard: Lịch Dock' };

export default async function DockSchedulingPage() {
  return (
    <PageContainer
      pageTitle='Tối ưu lịch Dock'
      pageDescription='Xếp lịch xe vào cửa dock theo thuật toán EDF — giảm thời gian chờ và tối ưu sử dụng cửa bến'
    >
      <Suspense fallback={<Skeleton className='h-96 rounded-lg' />}>
        <DockSchedulingWrapper />
      </Suspense>
    </PageContainer>
  );
}
