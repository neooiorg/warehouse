import PageContainer from '@/components/layout/page-container';
import { TraceabilityView } from '@/features/inventory/components/traceability-view';

export const metadata = {
  title: 'Dashboard: Inventory Traceability'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Traceability'
      pageDescription='Look up the full movement history of a lot or a storage location.'
    >
      <TraceabilityView />
    </PageContainer>
  );
}
