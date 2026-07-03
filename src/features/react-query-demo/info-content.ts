import type { InfobarContent } from '@/components/ui/infobar';

export const reactQueryInfoContent: InfobarContent = {
  title: 'Mẫu dùng React Query',
  sections: [
    {
      title: 'Prefetch trên server',
      description:
        'Dữ liệu được prefetch bằng getQueryClient().prefetchQuery(). State đã dehydrate được truyền vào HydrationBoundary để client mở trang bằng cache sẵn có.',
      links: [
        {
          title: 'Tài liệu TanStack Query SSR',
          url: 'https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr'
        }
      ]
    },
    {
      title: 'Query options',
      description:
        'Query key và hàm fetch được đặt trong queryOptions() dùng chung. Server prefetch và hook client dùng cùng cấu hình này.',
      links: [
        {
          title: 'API queryOptions',
          url: 'https://tanstack.com/query/latest/docs/framework/react/reference/queryOptions'
        }
      ]
    },
    {
      title: 'Suspense query',
      description:
        'Client dùng useSuspenseQuery() để đi cùng React Suspense. Khi cache còn mới, dữ liệu hiển thị ngay.',
      links: []
    },
    {
      title: 'Optimistic mutation',
      description:
        'Mutation có thể cập nhật cache trước bằng onMutate. Nếu lỗi, state cũ được khôi phục; khi hoàn tất, query được invalidate để lấy dữ liệu mới.',
      links: [
        {
          title: 'Hướng dẫn optimistic update',
          url: 'https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates'
        }
      ]
    }
  ]
};
