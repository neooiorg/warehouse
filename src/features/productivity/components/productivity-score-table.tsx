'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { productivityScoresQueryOptions } from '../api/queries';

export function ProductivityScoreTable({ warehouseId }: { warehouseId?: string }) {
  const { data } = useSuspenseQuery(productivityScoresQueryOptions(warehouseId));

  if (data.length === 0) {
    return <p className='text-sm text-muted-foreground'>Chưa có dữ liệu năng suất. Hãy ghi nhận đầu việc trước.</p>;
  }

  return (
    <div className='overflow-x-auto rounded-lg border'>
      <table className='w-full text-sm'>
        <thead className='bg-muted/50'>
          <tr>
            <th className='px-4 py-2 text-left font-medium'>#</th>
            <th className='px-4 py-2 text-left font-medium'>Nhân viên</th>
            <th className='px-4 py-2 text-left font-medium'>Vai trò</th>
            <th className='px-4 py-2 text-right font-medium'>Số đầu việc</th>
            <th className='px-4 py-2 text-right font-medium'>Tổng qty</th>
            <th className='px-4 py-2 text-right font-medium'>Qty/giờ</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.employeeId} className='border-t'>
              <td className='px-4 py-2 text-muted-foreground'>{i + 1}</td>
              <td className='px-4 py-2 font-medium'>{row.employeeName}</td>
              <td className='px-4 py-2'>
                {row.role && <Badge variant='secondary' className='text-xs'>{row.role}</Badge>}
              </td>
              <td className='px-4 py-2 text-right'>{row.tasksCompleted}</td>
              <td className='px-4 py-2 text-right'>{row.totalQty.toFixed(0)}</td>
              <td className='px-4 py-2 text-right font-semibold'>{row.qtyPerHour.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
