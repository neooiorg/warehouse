import PageContainer from '@/components/layout/page-container';
import { TraceabilityView } from '@/features/inventory/components/traceability-view';

export const metadata = {
  title: 'Quản lý kho: Truy xuất hàng hóa'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Truy xuất hàng hóa'
      pageDescription='Tra cứu lịch sử di chuyển theo lot hoặc vị trí lưu trữ.'
    >
      <TraceabilityView />
    </PageContainer>
  );
}
