import type { InfobarContent } from '@/components/ui/infobar';

export const usersInfoContent: InfobarContent = {
  title: 'Người dùng và React Query',
  sections: [
    {
      title: 'Tổng quan',
      description:
        'Trang này dùng React Query cùng nuqs để đồng bộ phân trang, tìm kiếm và lọc với URL.',
      links: [
        {
          title: 'Tài liệu TanStack Query SSR',
          url: 'https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr'
        }
      ]
    },
    {
      title: 'Prefetch và hydrate',
      description:
        'Server đọc search params, tạo bộ lọc và prefetch query. Client nhận cache qua HydrationBoundary rồi dùng useSuspenseQuery với cùng bộ lọc.',
      links: []
    },
    {
      title: 'URL state với nuqs',
      description:
        'Bảng ghi phân trang, tìm kiếm và lọc vai trò vào URL. Khi URL đổi, query key đổi và React Query tự lấy dữ liệu mới.',
      links: [
        {
          title: 'Tài liệu nuqs',
          url: 'https://nuqs.47ng.com'
        }
      ]
    },
    {
      title: 'Khi dùng mẫu này',
      description:
        'Mẫu này hợp với bảng cần cache, refetch nền và chia sẻ trạng thái giữa nhiều component.',
      links: []
    }
  ]
};
