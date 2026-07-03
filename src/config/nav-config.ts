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
      },
      {
        title: 'Dock Scheduling',
        url: '/dashboard/productivity/dock-scheduling',
        icon: 'truck',
        isActive: false,
        shortcut: ['d', 's'],
        items: []
      }
    ]
  },
  {
    label: 'Quản lý kho',
    items: [
      {
        title: 'Danh sách kho',
        url: '/dashboard/warehouses',
        icon: 'warehouse',
        isActive: false,
        shortcut: ['w', 'w'],
        items: []
      },
      {
        title: 'Tối ưu lưu trữ',
        url: '/dashboard/warehouses/optimizer',
        icon: 'settings',
        isActive: false,
        shortcut: ['w', 'o'],
        items: []
      }
    ]
  },
  {
    label: 'Nhân sự',
    items: [
      {
        title: 'KPI Nhân sự',
        url: '/dashboard/hr/kpi',
        icon: 'trendingUp',
        isActive: false,
        shortcut: ['h', 'k'],
        items: []
      },
      {
        title: 'Định biên & Gantt',
        url: '/dashboard/hr/staffing',
        icon: 'teams',
        isActive: false,
        shortcut: ['h', 's'],
        items: []
      }
    ]
  },
  {
    label: 'Năng suất',
    items: [
      {
        title: 'Thống kê nhân viên',
        url: '/dashboard/productivity',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['p', 'p'],
        items: []
      }
    ]
  },
  {
    label: 'Vận chuyển',
    items: [
      {
        title: 'Lập kế hoạch',
        url: '/dashboard/transport/planning',
        icon: 'truck',
        isActive: false,
        shortcut: ['t', 'p'],
        items: []
      },
      {
        title: 'Giá xăng dầu',
        url: '/dashboard/transport/fuel-prices',
        icon: 'trendingUp',
        isActive: false,
        shortcut: ['t', 'f'],
        items: []
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
        shortcut: ['p', 'k'],
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
