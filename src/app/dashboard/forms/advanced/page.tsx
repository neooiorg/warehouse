import PageContainer from '@/components/layout/page-container';
import AdvancedFormPatterns from '@/features/forms/components/advanced-form-patterns';

export const metadata = {
  title: 'Quản lý kho: Form nâng cao'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Form nâng cao'
      pageDescription='Linked fields, async validation, dynamic rows, nested objects, cross-field validation, and form-level errors.'
    >
      <AdvancedFormPatterns />
    </PageContainer>
  );
}
