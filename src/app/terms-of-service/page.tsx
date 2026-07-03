import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Điều khoản dịch vụ',
  robots: {
    index: false
  }
};

export default function TermsOfServicePage() {
  return (
    <div className='min-h-screen px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl space-y-8'>
        <div className='text-center'>
          <h1 className='text-foreground text-3xl font-bold'>Điều khoản dịch vụ</h1>
          <p className='text-muted-foreground mt-2 text-sm'>Cập nhật lần cuối: 07/2026</p>
        </div>

        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Phạm vi sử dụng</h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Ứng dụng phục vụ thử nghiệm và vận hành nội bộ. Khi sử dụng hệ thống, bạn chịu trách
            nhiệm về dữ liệu nhập vào và các thao tác thực hiện bằng tài khoản của mình.
          </p>
        </section>

        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Môi trường demo</h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Dữ liệu demo có thể thay đổi hoặc bị xóa trong quá trình kiểm thử. Không dùng môi trường
            này để lưu dữ liệu sản xuất, thông tin cá nhân nhạy cảm hoặc tài liệu mật.
          </p>
        </section>

        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Mã nguồn</h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Dự án dựa trên template mã nguồn mở và đã được tùy biến cho nghiệp vụ kho. Xem giấy phép
            và hướng dẫn đóng góp trong repository của dự án.
          </p>
        </section>

        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Giới hạn trách nhiệm</h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Hệ thống không cam kết tính phù hợp cho mọi tình huống vận hành. Kiểm thử quy trình,
            phân quyền và dữ liệu trước khi dùng cho môi trường sản xuất.
          </p>
        </section>

        <section className='border-border border-t pt-4'>
          <p className='text-muted-foreground text-center text-sm'>
            Xem tài liệu dự án hoặc liên hệ đội phát triển nếu cần hỗ trợ thêm.
          </p>
        </section>
      </div>
    </div>
  );
}
