import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import {
  warehouseDetailOptions,
  zoneListOptions,
  locationListOptions,
  dockListOptions
} from '@/features/warehouses/api/queries';
import WarehouseDetail from '@/features/warehouses/components/warehouse-detail';
import { getWarehouse } from '@/features/warehouses/api/service';

export const metadata = { title: 'Dashboard: Chi tiết kho' };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  const warehouse = await getWarehouse(id);
  if (!warehouse) notFound();

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(warehouseDetailOptions(id)),
    queryClient.prefetchQuery(zoneListOptions(id)),
    queryClient.prefetchQuery(locationListOptions(id)),
    queryClient.prefetchQuery(dockListOptions(id))
  ]);

  return (
    <PageContainer
      pageTitle={warehouse.name}
      pageDescription={`Mã: ${warehouse.code}${warehouse.address ? ` · ${warehouse.address}` : ''}`}
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense
          fallback={<div className='text-muted-foreground p-8 text-center'>Đang tải...</div>}
        >
          <WarehouseDetail warehouseId={id} />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
