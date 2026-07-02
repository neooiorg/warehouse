import PageContainer from '@/components/layout/page-container';
import InventoryListingPage from '@/features/inventory/components/inventory-listing';
import { InventoryActions } from '@/features/inventory/components/inventory-actions';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Inventory'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Inventory'
      pageDescription='Current lots, and inbound / outbound / transfer recording.'
      pageHeaderAction={<InventoryActions />}
    >
      <InventoryListingPage />
    </PageContainer>
  );
}
