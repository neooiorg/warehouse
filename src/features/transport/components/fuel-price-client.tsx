'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Icons } from '@/components/icons';
import { fuelPricesQueryOptions } from '../api/queries';

const chartConfig = {
  RON95: { label: 'RON 95', color: 'var(--chart-1)' },
  RON92: { label: 'RON 92', color: 'var(--chart-2)' },
  DO: { label: 'Dầu DO', color: 'var(--chart-3)' }
};

export function FuelPriceClient() {
  const { data: prices } = useSuspenseQuery(fuelPricesQueryOptions());

  async function handleRefresh() {
    await fetch('/api/cron/fuel-prices');
    window.location.reload();
  }

  // Group by date for chart
  const byDate = new Map<string, Record<string, number>>();
  for (const p of prices) {
    if (!byDate.has(p.effectiveDate)) byDate.set(p.effectiveDate, {});
    byDate.get(p.effectiveDate)![p.fuelType] = p.priceVnd;
  }
  const chartData = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, vals]) => ({ date, ...vals }));

  return (
    <div className='space-y-6'>
      <div className='flex justify-end'>
        <Button variant='outline' size='sm' onClick={handleRefresh}>
          <Icons.spinner className='mr-2 h-4 w-4' />Cập nhật giá hôm nay
        </Button>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng giá xăng dầu (30 ngày gần nhất)</CardTitle>
            <CardDescription>Đơn vị: đồng/lít</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className='h-[250px] w-full'>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='date' tickFormatter={(v) => v.slice(5)} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {Object.keys(chartConfig).map((key) => (
                  <Line key={key} type='monotone' dataKey={key} stroke={chartConfig[key as keyof typeof chartConfig].color} dot={false} />
                ))}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <div className='overflow-x-auto rounded-lg border'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50'>
            <tr>
              <th className='px-4 py-2 text-left font-medium'>Ngày hiệu lực</th>
              <th className='px-4 py-2 text-left font-medium'>Loại</th>
              <th className='px-4 py-2 text-right font-medium'>Giá (đ/lít)</th>
              <th className='px-4 py-2 text-left font-medium'>Khu vực</th>
              <th className='px-4 py-2 text-left font-medium'>Nguồn</th>
            </tr>
          </thead>
          <tbody>
            {prices.length === 0 && (
              <tr><td colSpan={5} className='px-4 py-4 text-center text-muted-foreground'>Chưa có dữ liệu. Nhấn "Cập nhật" để lấy giá mới.</td></tr>
            )}
            {prices.map((p) => (
              <tr key={p.id} className='border-t'>
                <td className='px-4 py-2'>{p.effectiveDate}</td>
                <td className='px-4 py-2'><Badge variant='outline' className='text-xs'>{p.fuelType}</Badge></td>
                <td className='px-4 py-2 text-right font-mono'>{p.priceVnd.toLocaleString('vi-VN')}</td>
                <td className='px-4 py-2'>{p.region}</td>
                <td className='px-4 py-2 text-xs text-muted-foreground'>{p.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
