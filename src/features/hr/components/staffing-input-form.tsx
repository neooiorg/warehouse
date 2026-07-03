'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppForm } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { computeStaffingPlanMutation } from '../api/mutations';
import type { StaffingResult } from '../api/types';

type Props = {
  onResult: (result: StaffingResult) => void;
};

export function StaffingInputForm({ onResult }: Props) {
  const mutation = useMutation(computeStaffingPlanMutation);

  const form = useAppForm({
    defaultValues: {
      planDate: new Date().toISOString().split('T')[0],
      dailyVolume: 100,
      workHoursPerShift: 8
    },
    onSubmit: async ({ value }) => {
      const res = await mutation.mutateAsync(value);
      onResult(res.result);
    }
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='flex flex-wrap items-end gap-4'
    >
      <form.Field name='planDate'>
        {(field) => (
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Ngày kế hoạch</label>
            <input
              type='date'
              className='rounded-md border px-3 py-2 text-sm'
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>
      <form.Field name='dailyVolume'>
        {(field) => (
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Sản lượng/ngày</label>
            <input
              type='number'
              min={1}
              className='w-28 rounded-md border px-3 py-2 text-sm'
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
          </div>
        )}
      </form.Field>
      <form.Field name='workHoursPerShift'>
        {(field) => (
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Giờ làm/ca</label>
            <input
              type='number'
              min={1}
              max={12}
              step={0.5}
              className='w-24 rounded-md border px-3 py-2 text-sm'
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
          </div>
        )}
      </form.Field>
      <Button type='submit' disabled={mutation.isPending}>
        {mutation.isPending ? 'Đang tính...' : 'Tính định biên'}
      </Button>
    </form>
  );
}
