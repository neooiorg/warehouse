import type { InfobarContent } from '@/components/ui/infobar';

export const workspacesInfoContent: InfobarContent = {
  title: 'Quản lý workspace',
  sections: [
    {
      title: 'Tổng quan',
      description:
        'Workspace dùng Clerk Organizations để tách dữ liệu, thành viên và quyền truy cập theo từng tổ chức.',
      links: [
        {
          title: 'Tài liệu Clerk Organizations',
          url: 'https://clerk.com/docs/organizations/overview'
        }
      ]
    },
    {
      title: 'Tạo workspace',
      description:
        'Tạo workspace mới trong trang này, sau đó chuyển sang workspace đó để quản lý đội và dữ liệu riêng.',
      links: [
        {
          title: 'Hướng dẫn multi-tenant với Clerk',
          url: 'https://clerk.com/blog/how-to-build-multitenant-authentication-with-clerk'
        }
      ]
    },
    {
      title: 'Chuyển workspace',
      description:
        'Chọn workspace trong danh sách để đổi ngữ cảnh làm việc. Các màn theo tổ chức sẽ dùng workspace đang chọn.',
      links: []
    },
    {
      title: 'Kiểm tra quyền',
      description:
        'Giao diện có thể ẩn hiện theo vai trò, nhưng kiểm tra quyền quan trọng vẫn cần chạy ở server.',
      links: []
    }
  ]
};

export const teamInfoContent: InfobarContent = {
  title: 'Quản lý đội',
  sections: [
    {
      title: 'Tổng quan',
      description:
        'Trang đội dùng Clerk OrganizationProfile để quản lý thành viên, vai trò và cấu hình bảo mật của workspace.',
      links: [
        {
          title: 'Tài liệu Clerk Organizations',
          url: 'https://clerk.com/docs/organizations/overview'
        }
      ]
    },
    {
      title: 'Thành viên',
      description:
        'Mời thành viên bằng email, gán vai trò và thu hồi quyền khi cần. Quyền thực tế phụ thuộc cấu hình trong Clerk.',
      links: []
    },
    {
      title: 'Vai trò và quyền',
      description:
        'Vai trò được cấu hình trong Clerk Dashboard. App dùng các quyền này để lọc điều hướng và bảo vệ tác vụ.',
      links: [
        {
          title: 'Tài liệu Clerk Organizations',
          url: 'https://clerk.com/docs/organizations/overview'
        }
      ]
    },
    {
      title: 'Cài đặt bảo mật',
      description:
        'Kiểm tra yêu cầu đăng nhập, phiên làm việc và quyền truy cập để bảo vệ dữ liệu của từng workspace.',
      links: []
    }
  ]
};

export const billingInfoContent: InfobarContent = {
  title: 'Thanh toán và gói',
  sections: [
    {
      title: 'Tổng quan',
      description:
        'Trang thanh toán dùng Clerk Billing để quản lý gói, giới hạn sử dụng và thanh toán theo tổ chức.',
      links: [
        {
          title: 'Tài liệu Clerk Billing',
          url: 'https://clerk.com/docs/billing/overview'
        }
      ]
    },
    {
      title: 'Gói khả dụng',
      description:
        'Các gói được tạo trong Clerk Dashboard. Bật chế độ public cho gói nếu muốn hiển thị trong bảng giá.',
      links: [
        {
          title: 'Clerk Dashboard - Plans',
          url: 'https://dashboard.clerk.com/~/billing/plans'
        }
      ]
    },
    {
      title: 'Tính năng theo gói',
      description:
        'Mỗi gói có thể mở khóa tính năng riêng. Server có thể kiểm tra bằng hàm has() trước khi cho truy cập.',
      links: []
    },
    {
      title: 'Thiết lập',
      description:
        'Bật Billing trong Clerk Dashboard và chọn gateway phát triển hoặc tài khoản Stripe production.',
      links: [
        {
          title: 'Billing settings',
          url: 'https://dashboard.clerk.com/~/billing/settings'
        }
      ]
    }
  ]
};

export const productInfoContent: InfobarContent = {
  title: 'Quản lý sản phẩm',
  sections: [
    {
      title: 'Tổng quan',
      description:
        'Trang sản phẩm hiển thị danh mục hàng hóa dưới dạng bảng có tìm kiếm, lọc, sắp xếp và phân trang.',
      links: [
        {
          title: 'Hướng dẫn quản lý sản phẩm',
          url: '#'
        }
      ]
    },
    {
      title: 'Thêm sản phẩm',
      description: 'Bấm Thêm sản phẩm, nhập tên, mô tả, giá, danh mục và ảnh nếu có, rồi lưu.',
      links: [
        {
          title: 'Tài liệu thêm sản phẩm',
          url: '#'
        }
      ]
    },
    {
      title: 'Sửa sản phẩm',
      description:
        'Mở sản phẩm từ bảng để chỉnh thông tin. Thay đổi chỉ được lưu sau khi gửi form.',
      links: [
        {
          title: 'Hướng dẫn sửa sản phẩm',
          url: '#'
        }
      ]
    },
    {
      title: 'Xóa sản phẩm',
      description: 'Xóa sản phẩm từ menu thao tác trong bảng. App sẽ hỏi xác nhận trước khi xóa.',
      links: [
        {
          title: 'Chính sách xóa sản phẩm',
          url: '#'
        }
      ]
    },
    {
      title: 'Trường dữ liệu',
      description:
        'Mỗi sản phẩm gồm tên, mô tả, giá, danh mục và ảnh. Các trường này có thể chỉnh khi tạo hoặc cập nhật.',
      links: [
        {
          title: 'Đặc tả trường sản phẩm',
          url: '#'
        }
      ]
    }
  ]
};
