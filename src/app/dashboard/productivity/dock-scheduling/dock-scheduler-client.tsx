'use client';

import DockScheduler from '@/features/productivity/components/dock-scheduler';

type Props = {
  warehouseId: string;
  warehouseName: string;
  docks: { id: string; name: string }[];
};

export default function DockSchedulerClient({ warehouseId, warehouseName, docks }: Props) {
  return (
    <div className='space-y-4'>
      <p className='text-sm text-muted-foreground'>
        Kho: <span className='font-medium text-foreground'>{warehouseName}</span>
      </p>
      <DockScheduler warehouseId={warehouseId} docks={docks} avgMinutesPerPallet={3} />
    </div>
  );
}
