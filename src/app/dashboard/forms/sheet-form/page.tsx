import PageContainer from '@/components/layout/page-container';
import SheetFormDemo from '@/features/forms/components/sheet-form-demo';

export const metadata = {
  title: 'Quản lý kho: Form trong panel'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Form trong panel'
      pageDescription='Form patterns inside sheets and dialogs with external submit buttons.'
    >
      <SheetFormDemo />
    </PageContainer>
  );
}
