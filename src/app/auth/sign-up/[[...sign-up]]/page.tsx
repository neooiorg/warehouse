import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Xác thực | Đăng ký',
  description: 'Trang đăng ký.'
};

export default async function Page() {
  return <SignUpViewPage />;
}
