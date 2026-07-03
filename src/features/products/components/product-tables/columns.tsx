'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Product } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { CellAction } from './cell-action';
import { CATEGORY_OPTIONS } from './options';

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'photo_url',
    header: 'ẢNH',
    cell: ({ row }) => {
      return (
        <div className='relative aspect-square'>
          <Image
            src={row.getValue('photo_url')}
            alt={row.getValue('name')}
            fill
            sizes='80px'
            className='rounded-lg'
          />
        </div>
      );
    }
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Product, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tên sản phẩm' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<Product['name']>()}</div>,
    meta: {
      label: 'Tên sản phẩm',
      placeholder: 'Tìm sản phẩm...',
      variant: 'text',
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'category',
    accessorKey: 'category',
    enableSorting: false,
    header: ({ column }: { column: Column<Product, unknown> }) => (
      <DataTableColumnHeader column={column} title='Danh mục' />
    ),
    cell: ({ cell }) => {
      const category = cell.getValue<Product['category']>();
      const label = CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category;

      return (
        <Badge variant='outline' className='capitalize'>
          <Icons.circleCheck />
          {label}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Danh mục',
      variant: 'multiSelect',
      options: CATEGORY_OPTIONS
    }
  },
  {
    accessorKey: 'price',
    header: 'GIÁ'
  },
  {
    accessorKey: 'description',
    header: 'MÔ TẢ'
  },

  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
