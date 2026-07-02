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
      <DataTableColumnHeader column={column} title='Lot No.' />
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
    header: 'Warehouse'
  },
  {
    id: 'locationCode',
    accessorKey: 'locationCode',
    header: 'Location',
    cell: ({ cell }) => cell.getValue<string | null>() ?? '—'
  },
  {
    id: 'qty',
    accessorKey: 'qty',
    header: ({ column }: { column: Column<LotWithDetails, unknown> }) => (
      <DataTableColumnHeader column={column} title='Qty' />
    )
  },
  {
    id: 'receivedDate',
    accessorKey: 'receivedDate',
    header: ({ column }: { column: Column<LotWithDetails, unknown> }) => (
      <DataTableColumnHeader column={column} title='Received' />
    )
  },
  {
    id: 'expiryDate',
    accessorKey: 'expiryDate',
    header: 'Expiry',
    cell: ({ cell }) => cell.getValue<string | null>() ?? '—'
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ cell }) => {
      const status = cell.getValue<LotWithDetails['status']>();
      return (
        <Badge variant={STATUS_VARIANT[status]} className='capitalize'>
          {status}
        </Badge>
      );
    }
  }
];
