'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { User } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { ROLE_OPTIONS } from './options';

export const columns: ColumnDef<User>[] = [
  {
    id: 'name',
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Họ tên' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>
          {row.original.first_name} {row.original.last_name}
        </span>
        <span className='text-muted-foreground text-xs'>{row.original.email}</span>
      </div>
    ),
    meta: {
      label: 'Họ tên',
      placeholder: 'Tìm người dùng...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'phone',
    header: 'SỐ ĐIỆN THOẠI'
  },
  {
    id: 'role',
    accessorKey: 'role',
    enableSorting: false,
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Vai trò' />
    ),
    cell: ({ cell }) => {
      const role = cell.getValue<User['role']>();
      const label = ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;

      return (
        <Badge variant='outline' className='capitalize'>
          {label}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Vai trò',
      variant: 'multiSelect' as const,
      options: ROLE_OPTIONS
    }
  },
  {
    accessorKey: 'status',
    header: 'TRẠNG THÁI',
    cell: ({ cell }) => {
      const status = cell.getValue<User['status']>();
      const variant =
        status === 'Active' ? 'default' : status === 'Inactive' ? 'secondary' : 'outline';
      const label =
        status === 'Active' ? 'Đang hoạt động' : status === 'Inactive' ? 'Tạm khóa' : 'Đã mời';
      return <Badge variant={variant}>{label}</Badge>;
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
