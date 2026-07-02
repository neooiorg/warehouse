import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { warehouseListOptions } from '@/features/warehouses/api/queries';
import WarehouseListing from '@/features/warehouses/components/warehouse-listing';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export const metadata = { title: 'Dashboard: Kho hàng' };

export default async function Page() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(warehouseListOptions({}));

  return (
    <PageContainer
      pageTitle='Quản lý kho hàng'
      pageDescription='Danh sách kho, khu vực, vị trí lưu trữ và cửa dock.'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<DataTableSkeleton columnCount={6} rowCount={8} />}>
          <WarehouseListing />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
