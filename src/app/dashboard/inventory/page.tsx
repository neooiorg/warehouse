import PageContainer from '@/components/layout/page-container';
import InventoryListingPage from '@/features/inventory/components/inventory-listing';
import { InventoryActions } from '@/features/inventory/components/inventory-actions';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Quản lý kho: Tồn kho'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Tồn kho'
      pageDescription='Theo dõi lot hiện có và ghi nhận nhập, xuất, chuyển vị trí.'
      pageHeaderAction={<InventoryActions />}
    >
      <InventoryListingPage />
    </PageContainer>
  );
}
