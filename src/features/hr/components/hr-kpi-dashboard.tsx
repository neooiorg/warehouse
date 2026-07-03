'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { hrKpiOptions } from '../api/queries';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function HrKpiDashboard() {
  const { data } = useSuspenseQuery(hrKpiOptions());

  const turnoverColor =
    data.turnoverRatePercent > 10
      ? 'text-destructive'
      : data.turnoverRatePercent > 5
        ? 'text-yellow-500'
        : 'text-green-500';

  return (
    <div className='space-y-6'>
      {/* Metric cards */}
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-normal'>
              Đang làm việc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold'>{data.totalActive}</p>
            <p className='text-muted-foreground text-xs'>nhân viên đang làm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-normal'>
              Đã nghỉ việc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold'>{data.totalTerminated}</p>
            <p className='text-muted-foreground text-xs'>nhân viên đã nghỉ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-normal'>
              Tỷ lệ nghỉ việc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${turnoverColor}`}>
              {data.turnoverRatePercent.toFixed(1)}%
            </p>
            <p className='text-muted-foreground text-xs'>12 tháng gần nhất</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-normal'>Gắn bó TB</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold'>{data.avgTenureMonths.toFixed(1)}</p>
            <p className='text-muted-foreground text-xs'>tháng/nhân viên</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline chart */}
      <Card>
        <CardHeader>
          <CardTitle>Biến động nhân sự 12 tháng</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width='100%' height={220}>
            <AreaChart
              data={data.headcountTimeline}
              margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
            >
              <XAxis dataKey='month' tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area
                type='monotone'
                dataKey='hired'
                name='Tuyển mới'
                stroke='#10b981'
                fill='#10b98122'
                strokeWidth={2}
              />
              <Area
                type='monotone'
                dataKey='terminated'
                name='Nghỉ việc'
                stroke='#ef4444'
                fill='#ef444422'
                strokeWidth={2}
              />
              <Area
                type='monotone'
                dataKey='net'
                name='Tăng trưởng ròng'
                stroke='#6366f1'
                fill='#6366f122'
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
