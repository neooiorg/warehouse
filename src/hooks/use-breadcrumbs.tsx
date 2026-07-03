'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// Custom breadcrumb labels for dashboard routes.
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Tổng quan', link: '/dashboard' }],
  '/dashboard/employee': [
    { title: 'Tổng quan', link: '/dashboard' },
    { title: 'Nhân viên', link: '/dashboard/employee' }
  ],
  '/dashboard/product': [
    { title: 'Tổng quan', link: '/dashboard' },
    { title: 'Sản phẩm', link: '/dashboard/product' }
  ]
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
