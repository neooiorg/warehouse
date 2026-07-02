import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { locationListOptions, zoneListOptions } from '@/features/warehouses/api/queries';
import FloorPlanEditor from '@/features/warehouses/components/floor-plan-editor';
import { getWarehouse } from '@/features/warehouses/api/service';

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  const warehouse = await getWarehouse(id);
  if (!warehouse) notFound();

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(locationListOptions(id)),
    queryClient.prefetchQuery(zoneListOptions(id))
  ]);

  return (
    <PageContainer
      pageTitle={`Sơ đồ kho: ${warehouse.name}`}
      pageDescription='Kéo thả vị trí để bố trí mặt bằng kho. Thay đổi tự động lưu.'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense
          fallback={<div className='text-muted-foreground p-8 text-center'>Đang tải sơ đồ...</div>}
        >
          <FloorPlanEditor warehouseId={id} />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
