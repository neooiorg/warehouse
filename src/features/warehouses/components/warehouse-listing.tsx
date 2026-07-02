'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { warehouseListOptions } from '../api/queries';
import { useDeleteWarehouse } from '../api/mutations';
import WarehouseFormSheet from './warehouse-form-sheet';
import Link from 'next/link';

export default function WarehouseListing() {
  const [{ page, search }, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    search: parseAsString.withDefault('')
  });

  const { data } = useSuspenseQuery(warehouseListOptions({ page, search: search || undefined }));
  const deleteMutation = useDeleteWarehouse();

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-4'>
        <Input
          placeholder='Tìm kho theo tên hoặc mã...'
          value={search}
          onChange={(e) => setParams({ search: e.target.value, page: 1 })}
          className='max-w-sm'
        />
        <WarehouseFormSheet>
          <Button size='sm'>
            <Icons.add className='mr-2 h-4 w-4' />
            Thêm kho
          </Button>
        </WarehouseFormSheet>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên kho</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead className='text-center'>Khu vực</TableHead>
              <TableHead className='text-center'>Vị trí</TableHead>
              <TableHead className='text-center'>Cửa dock</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className='text-muted-foreground py-8 text-center'>
                  Chưa có kho nào. Hãy tạo kho đầu tiên.
                </TableCell>
              </TableRow>
            )}
            {data.data.map((wh) => (
              <TableRow key={wh.id}>
                <TableCell>
                  <Badge variant='outline'>{wh.code}</Badge>
                </TableCell>
                <TableCell className='font-medium'>
                  <Link
                    href={`/dashboard/warehouses/${wh.id}`}
                    className='hover:text-primary hover:underline'
                  >
                    {wh.name}
                  </Link>
                </TableCell>
                <TableCell className='text-muted-foreground text-sm'>{wh.address ?? '—'}</TableCell>
                <TableCell className='text-center'>{wh.zoneCount}</TableCell>
                <TableCell className='text-center'>{wh.locationCount}</TableCell>
                <TableCell className='text-center'>{wh.dockCount}</TableCell>
                <TableCell className='flex justify-end gap-2'>
                  <WarehouseFormSheet warehouse={wh}>
                    <Button size='icon' variant='ghost'>
                      <Icons.edit className='h-4 w-4' />
                    </Button>
                  </WarehouseFormSheet>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='text-destructive hover:text-destructive'
                    onClick={() => deleteMutation.mutate(wh.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Icons.trash className='h-4 w-4' />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data.total > 20 && (
        <div className='flex justify-end gap-2'>
          <Button
            size='sm'
            variant='outline'
            disabled={page <= 1}
            onClick={() => setParams({ page: page - 1 })}
          >
            Trước
          </Button>
          <Button
            size='sm'
            variant='outline'
            disabled={page * 20 >= data.total}
            onClick={() => setParams({ page: page + 1 })}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
