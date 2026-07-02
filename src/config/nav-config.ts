import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      }
    ]
  },
  {
    label: 'Vận hành',
    items: [
      {
        title: 'Kho hàng',
        url: '#',
        icon: 'warehouse',
        isActive: false,
        items: [
          {
            title: 'Nhập kho',
            url: '/dashboard/inventory',
            icon: 'inbound',
            shortcut: ['i', 'n']
          },
          {
            title: 'Xuất kho',
            url: '/dashboard/inventory',
            icon: 'outbound',
            shortcut: ['i', 'x']
          },
          {
            title: 'Truy xuất nguồn gốc',
            url: '/dashboard/inventory/traceability',
            icon: 'search',
            shortcut: ['i', 't']
          }
        ]
      }
    ]
  },
  {
    label: 'Dữ liệu',
    items: [
      {
        title: 'Sản phẩm (SKU)',
        url: '/dashboard/product',
        icon: 'product',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      },
      {
        title: 'Nhân viên',
        url: '/dashboard/users',
        icon: 'teams',
        shortcut: ['u', 'u'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: 'Tài khoản',
        url: '#',
        icon: 'account',
        isActive: true,
        items: [
          {
            title: 'Hồ sơ',
            url: '/dashboard/profile',
            icon: 'profile',
            shortcut: ['m', 'm']
          },
          {
            title: 'Thông báo',
            url: '/dashboard/notifications',
            icon: 'notification',
            shortcut: ['n', 'n']
          },
          {
            title: 'Thanh toán',
            url: '/dashboard/billing',
            icon: 'billing',
            shortcut: ['b', 'b'],
            access: { requireOrg: true }
          }
        ]
      }
    ]
  }
];
