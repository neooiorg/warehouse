import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật',
  robots: {
    index: false
  }
};

export default function PrivacyPolicyPage() {
  return (
    <div className='min-h-screen px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl space-y-8'>
        <h1 className='text-foreground text-3xl font-bold'>Chính sách bảo mật</h1>

        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Dữ liệu tài khoản</h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Ứng dụng dùng thông tin tài khoản do Clerk cung cấp, như email, tên hiển thị và tổ chức
            đang chọn. Những dữ liệu này phục vụ đăng nhập, phân quyền và hiển thị giao diện.
          </p>
        </section>

        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Xử lý xác thực</h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Clerk xử lý đăng ký, đăng nhập và quản lý phiên. Xem chính sách của Clerk tại{' '}
            <a
              href='https://clerk.com/legal/privacy'
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary font-medium hover:underline'
            >
              clerk.com/legal/privacy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Bản demo</h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Đây là môi trường demo. Dữ liệu kiểm thử có thể được xóa, đặt lại hoặc thay đổi khi bảo
            trì. Không nhập thông tin cá nhân nhạy cảm, bí mật kinh doanh hoặc dữ liệu sản xuất.
          </p>
        </section>

        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Liên hệ</h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Gửi câu hỏi về dữ liệu hoặc quyền riêng tư tới{' '}
            <a
              href='mailto:contact@kiranism.dev'
              className='text-primary font-medium hover:underline'
            >
              contact@kiranism.dev
            </a>
            .
          </p>
        </section>

        <div className='border-border border-t pt-4'>
          <p className='text-muted-foreground text-sm'>Cập nhật lần cuối: 07/2026</p>
        </div>
      </div>
    </div>
  );
}
