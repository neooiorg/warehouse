import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Giới thiệu'
};

export default function AboutPage() {
  return (
    <div className='min-h-screen px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl'>
        <div className='mb-12 text-center'>
          <h1 className='text-foreground text-3xl font-bold tracking-tight sm:text-4xl'>
            Giới thiệu
          </h1>
          <p className='text-muted-foreground mt-4 text-lg'>
            Bảng điều khiển cho vận hành kho, nhân sự và vận chuyển.
          </p>
        </div>

        <div className='space-y-8'>
          <section className='bg-card rounded-2xl border p-8 shadow-sm'>
            <h2 className='text-foreground mb-4 text-xl font-semibold'>Mục đích</h2>
            <p className='text-muted-foreground text-lg leading-relaxed'>
              Ứng dụng gom các màn hình quản lý kho vào một nơi: nhập xuất hàng, truy xuất lô, lịch
              dock, năng suất nhân viên, định biên và vận chuyển.
            </p>
          </section>

          <section className='bg-card rounded-2xl border p-8 shadow-sm'>
            <h2 className='text-foreground mb-4 text-xl font-semibold'>Xác thực</h2>
            <p className='text-muted-foreground text-lg leading-relaxed'>
              Clerk xử lý đăng nhập, phiên làm việc và hồ sơ người dùng. Ứng dụng chỉ dùng dữ liệu
              cần thiết để phân quyền và hiển thị đúng không gian làm việc.
            </p>
          </section>

          <section className='bg-card rounded-2xl border p-8 shadow-sm'>
            <h2 className='text-foreground mb-4 text-xl font-semibold'>Dữ liệu</h2>
            <p className='text-muted-foreground text-lg leading-relaxed'>
              Không nhập dữ liệu nhạy cảm khi chạy bản demo. Dữ liệu có thể được xóa hoặc đặt lại
              trong quá trình kiểm thử.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
