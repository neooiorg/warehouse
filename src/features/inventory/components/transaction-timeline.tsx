'use client';

import { Badge } from '@/components/ui/badge';
import type { TransactionWithDetails } from '../api/types';

const TYPE_VARIANT: Record<
  TransactionWithDetails['type'],
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  inbound: 'default',
  outbound: 'destructive',
  transfer: 'secondary',
  adjustment: 'outline'
};

export function TransactionTimeline({ transactions }: { transactions: TransactionWithDetails[] }) {
  if (transactions.length === 0) {
    return (
      <p className='text-muted-foreground py-8 text-center text-sm'>Chưa có lịch sử di chuyển.</p>
    );
  }

  return (
    <ol className='space-y-3'>
      {transactions.map((tx) => (
        <li key={tx.id} className='flex items-start gap-3 rounded-lg border p-3'>
          <Badge variant={TYPE_VARIANT[tx.type]} className='mt-0.5 shrink-0'>
            {tx.type === 'inbound'
              ? 'Nhập'
              : tx.type === 'outbound'
                ? 'Xuất'
                : tx.type === 'transfer'
                  ? 'Chuyển'
                  : 'Điều chỉnh'}
          </Badge>
          <div className='min-w-0 flex-1 space-y-1'>
            <div className='flex flex-wrap items-center gap-x-2 text-sm'>
              <span className='font-medium'>
                {tx.sku} — {tx.skuName}
              </span>
              <span className='text-muted-foreground'>SL {tx.qty}</span>
            </div>
            <div className='text-muted-foreground text-xs'>
              {tx.fromLocationCode ?? '—'} → {tx.toLocationCode ?? '—'} · {tx.warehouseCode}
              {tx.performedByName && ` · ${tx.performedByName}`}
            </div>
            {tx.note && <div className='text-xs italic'>{tx.note}</div>}
          </div>
          <span className='text-muted-foreground shrink-0 text-xs'>
            {new Date(tx.occurredAt).toLocaleString()}
          </span>
        </li>
      ))}
    </ol>
  );
}
