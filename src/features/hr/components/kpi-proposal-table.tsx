'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { KpiProposal } from '../utils/kpi-proposer';

type Props = { proposals: KpiProposal[] };

export default function KpiProposalTable({ proposals }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>KPI Proposals từ lịch định biên</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <div className='grid grid-cols-[1fr_200px_100px] gap-3 px-2 text-xs font-medium text-muted-foreground'>
            <span>Chỉ số KPI</span>
            <span>Mục tiêu</span>
            <span>Đơn vị</span>
          </div>
          {proposals.map((p) => (
            <div
              key={p.id}
              className='grid grid-cols-[1fr_200px_100px] items-start gap-3 rounded-md border px-3 py-2'
            >
              <div>
                <div className='text-sm font-medium'>{p.name}</div>
                <div className='text-xs text-muted-foreground'>{p.rationale}</div>
              </div>
              <div className='text-sm font-semibold text-primary'>{p.target}</div>
              <div className='text-xs text-muted-foreground'>{p.unit}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
