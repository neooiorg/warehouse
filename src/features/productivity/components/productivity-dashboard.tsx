'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { productivitySummaryOptions } from '../api/queries';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function ProductivityDashboard() {
  const { data } = useSuspenseQuery(productivitySummaryOptions(30));

  if (data.employees.length === 0) {
    return (
      <div className='rounded-lg border p-12 text-center text-sm text-muted-foreground'>
        Chưa có dữ liệu giao dịch trong 30 ngày qua. Hãy thực hiện nhập/xuất kho để xem thống kê.
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-normal text-muted-foreground'>
              Nhân viên hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold'>{data.employees.length}</p>
            <p className='text-xs text-muted-foreground'>trong 30 ngày</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-normal text-muted-foreground'>
              Top performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xl font-bold truncate'>{data.topPerformer ?? '—'}</p>
            <p className='text-xs text-muted-foreground'>năng suất cao nhất</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-normal text-muted-foreground'>
              Tổng giao dịch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold'>
              {data.employees.reduce((s, e) => s + e.transactionCount, 0)}
            </p>
            <p className='text-xs text-muted-foreground'>{data.periodDays} ngày</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Năng suất nhân viên (pallet/ngày TB)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width='100%' height={240}>
            <BarChart
              data={data.employees.slice(0, 15)}
              layout='vertical'
              margin={{ left: 80, right: 20, top: 4, bottom: 4 }}
            >
              <XAxis type='number' tick={{ fontSize: 11 }} />
              <YAxis dataKey='employeeName' type='category' tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v: number) => [`${v} pallet/ngày`, 'TB']} />
              <Bar dataKey='avgDailyPallets' radius={[0, 4, 4, 0]}>
                {data.employees.slice(0, 15).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bảng xếp hạng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <div className='grid grid-cols-[30px_1fr_100px_100px_80px] gap-2 px-2 text-xs font-medium text-muted-foreground'>
              <span>#</span>
              <span>Nhân viên</span>
              <span>Giao dịch</span>
              <span>Tổng pallet</span>
              <span>TB/ngày</span>
            </div>
            {data.employees.map((e, i) => (
              <div
                key={e.employeeId}
                className='grid grid-cols-[30px_1fr_100px_100px_80px] items-center gap-2 rounded-md border px-2 py-2 text-sm'
              >
                <span className='font-bold text-muted-foreground'>{i + 1}</span>
                <span className='font-medium'>{e.employeeName}</span>
                <span>{e.transactionCount}</span>
                <span>{e.totalPallets.toLocaleString()}</span>
                <Badge variant={i === 0 ? 'default' : 'secondary'}>{e.avgDailyPallets}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
