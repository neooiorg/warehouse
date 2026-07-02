import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { lotsQueryOptions } from '../api/queries';
import { LotsTable } from './lots-table';

export default function InventoryListingPage() {
  const page = searchParamsCache.get('page');
  const perPage = searchParamsCache.get('perPage');

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(lotsQueryOptions({ page, limit: perPage }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LotsTable />
    </HydrationBoundary>
  );
}
