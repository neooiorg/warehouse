import PageContainer from '@/components/layout/page-container';
import DemoForm from '@/components/forms/demo-form';

export const metadata = {
  title: 'Quản lý kho: Form cơ bản'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Form cơ bản'
      pageDescription='Ví dụ nhập liệu với các loại trường thường dùng.'
    >
      <DemoForm />
    </PageContainer>
  );
}
