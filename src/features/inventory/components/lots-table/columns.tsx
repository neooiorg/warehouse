'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { LotWithDetails } from '../../api/types';
import type { Column, ColumnDef } from '@tanstack/react-table';

const STATUS_VARIANT: Record<
  LotWithDetails['status'],
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  available: 'default',
  reserved: 'secondary',
  depleted: 'outline',
  damaged: 'destructive'
};

export const columns: ColumnDef<LotWithDetails>[] = [
  {
    id: 'lotNo',
    accessorKey: 'lotNo',
    header: ({ column }: { column: Column<LotWithDetails, unknown> }) => (
      <DataTableColumnHeader column={column} title='Mã lô' />
    )
  },
  {
    id: 'sku',
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ row }) => (
      <div>
        <div className='font-medium'>{row.original.sku}</div>
        <div className='text-muted-foreground text-xs'>{row.original.skuName}</div>
      </div>
    )
  },
  {
    id: 'warehouseCode',
    accessorKey: 'warehouseCode',
    header: 'Kho'
  },
  {
    id: 'locationCode',
    accessorKey: 'locationCode',
    header: 'Vị trí',
    cell: ({ cell }) => cell.getValue<string | null>() ?? '—'
  },
  {
    id: 'qty',
    accessorKey: 'qty',
    header: ({ column }: { column: Column<LotWithDetails, unknown> }) => (
      <DataTableColumnHeader column={column} title='SL' />
    )
  },
  {
    id: 'receivedDate',
    accessorKey: 'receivedDate',
    header: ({ column }: { column: Column<LotWithDetails, unknown> }) => (
      <DataTableColumnHeader column={column} title='Ngày nhận' />
    )
  },
  {
    id: 'expiryDate',
    accessorKey: 'expiryDate',
    header: 'Hạn dùng',
    cell: ({ cell }) => cell.getValue<string | null>() ?? '—'
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ cell }) => {
      const status = cell.getValue<LotWithDetails['status']>();
      return (
        <Badge variant={STATUS_VARIANT[status]}>
          {status === 'available'
            ? 'Có thể xuất'
            : status === 'reserved'
              ? 'Đã giữ'
              : status === 'depleted'
                ? 'Đã hết'
                : 'Hỏng'}
        </Badge>
      );
    }
  }
];
