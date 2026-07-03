'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { turnoverMetricsQueryOptions } from '../api/queries';

export function TurnoverKpiCards({ warehouseId }: { warehouseId?: string }) {
  const { data } = useSuspenseQuery(turnoverMetricsQueryOptions(warehouseId));

  const stats = [
    {
      title: 'Nhân sự hiện tại',
      value: data.totalActive,
      unit: 'người',
      icon: <Icons.teams className='h-4 w-4 text-muted-foreground' />
    },
    {
      title: 'Tỷ lệ nghỉ việc',
      value: data.turnoverRate.toFixed(1),
      unit: '%',
      icon: <Icons.trendingDown className='h-4 w-4 text-muted-foreground' />
    },
    {
      title: 'Thời gian gắn bó TB',
      value: data.avgTenureMonths.toFixed(1),
      unit: 'tháng',
      icon: <Icons.clock className='h-4 w-4 text-muted-foreground' />
    },
    {
      title: 'Đã nghỉ việc',
      value: data.totalTerminated,
      unit: 'người',
      icon: <Icons.employee className='h-4 w-4 text-muted-foreground' />
    }
  ];

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {stats.map((s) => (
        <Card key={s.title}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>{s.title}</CardTitle>
            {s.icon}
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {s.value}{' '}
              <span className='text-sm font-normal text-muted-foreground'>{s.unit}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
