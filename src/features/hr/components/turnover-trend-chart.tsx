'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { turnoverMetricsQueryOptions } from '../api/queries';

const chartConfig = {
  hired: { label: 'Tuyển mới', color: 'var(--chart-1)' },
  terminated: { label: 'Nghỉ việc', color: 'var(--chart-2)' }
};

export function TurnoverTrendChart({ warehouseId }: { warehouseId?: string }) {
  const { data } = useSuspenseQuery(turnoverMetricsQueryOptions(warehouseId));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biến động nhân sự 12 tháng</CardTitle>
        <CardDescription>Số lượng tuyển mới và nghỉ việc theo tháng</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className='h-[250px] w-full'>
          <AreaChart data={data.monthlyTrend}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='month' tickFormatter={(v) => v.slice(5)} />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type='monotone' dataKey='hired' stroke='var(--chart-1)' fill='var(--chart-1)' fillOpacity={0.2} />
            <Area type='monotone' dataKey='terminated' stroke='var(--chart-2)' fill='var(--chart-2)' fillOpacity={0.2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
