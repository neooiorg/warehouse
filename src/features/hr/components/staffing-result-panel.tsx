'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GanttChart } from './gantt-chart';
import type { StaffingResult } from '../api/types';

export function StaffingResultPanel({ result }: { result: StaffingResult | null }) {
  if (!result) return null;

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {Object.entries(result.headcountByRole).map(([role, count]) => (
          <Card key={role}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>{role}</CardTitle>
            </CardHeader>
            <CardContent>
              <span className='text-2xl font-bold'>{count}</span>{' '}
              <span className='text-sm text-muted-foreground'>người</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-sm'>
            Sơ đồ Gantt - mạng AON
            <Badge variant='destructive' className='text-xs'>
              Đỏ = đường găng
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GanttChart nodes={result.nodes} criticalPath={result.criticalPath} />
        </CardContent>
      </Card>

      <p className='text-sm text-muted-foreground'>
        Tổng thời gian hoàn thành: <strong>{result.totalDurationMinutes} phút</strong>
      </p>
    </div>
  );
}
