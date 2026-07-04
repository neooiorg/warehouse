'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { acceptKpiProposalsMutation } from '../api/mutations';
import type { KpiProposal } from '../api/types';

type Props = { proposals: KpiProposal[] };

export default function KpiProposalTable({ proposals }: Props) {
  const acceptMutation = useMutation(acceptKpiProposalsMutation);

  async function handleAcceptAll() {
    const result = await acceptMutation.mutateAsync({ proposals });
    toast.success(`Da luu ${result.created} mau KPI.`);
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between gap-3'>
        <CardTitle className='text-base'>De xuat KPI tu lich dinh bien</CardTitle>
        <Button size='sm' onClick={handleAcceptAll} disabled={acceptMutation.isPending}>
          Chap nhan de xuat
        </Button>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <div className='grid grid-cols-[1.2fr_1fr_110px_90px] gap-3 px-2 text-xs font-medium text-muted-foreground'>
            <span>KPI</span>
            <span>Cong thuc va co che</span>
            <span>Muc tieu</span>
            <span>Trong so</span>
          </div>
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className='grid grid-cols-[1.2fr_1fr_110px_90px] items-start gap-3 rounded-md border px-3 py-2'
            >
              <div>
                <div className='text-sm font-medium'>{proposal.kpiName}</div>
                <div className='text-xs text-muted-foreground'>{proposal.role}</div>
                <div className='text-xs text-muted-foreground'>{proposal.rationale}</div>
              </div>
              <div className='space-y-1 text-xs'>
                <div>{proposal.formula}</div>
                <div className='text-muted-foreground'>{proposal.mechanism}</div>
              </div>
              <div className='text-sm font-semibold text-primary'>
                {proposal.target} {proposal.unit}
              </div>
              <div className='text-xs text-muted-foreground'>{proposal.weight}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
