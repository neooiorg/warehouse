import PageContainer from '@/components/layout/page-container';
import FormsShowcasePage from '@/features/forms/components/forms-showcase-page';

export const metadata = {
  title: 'Quản lý kho: Form nhiều bước'
};

export default function Page() {
  return (
    <PageContainer pageTitle='Multi-Step Form' pageDescription='Multi-step wizard form pattern.'>
      <FormsShowcasePage />
    </PageContainer>
  );
}
