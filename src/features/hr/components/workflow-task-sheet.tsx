'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { createWorkflowTaskMutation, updateWorkflowTaskMutation } from '../api/mutations';
import type { WorkflowTask } from '../api/types';

type Props = { mode: 'create'; task?: never } | { mode: 'edit'; task: WorkflowTask };

export function WorkflowTaskSheet({ mode, task }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(task?.name ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimatedMinutes ?? 30);
  const [requiredRole, setRequiredRole] = useState(task?.requiredRole ?? '');
  const [sortOrder, setSortOrder] = useState(task?.sortOrder ?? 0);
  const [outputUnit, setOutputUnit] = useState(task?.outputUnit ?? 'qty');
  const [standardRatePerHour, setStandardRatePerHour] = useState(task?.standardRatePerHour ?? 1);
  const [kpiCategory, setKpiCategory] = useState(task?.kpiCategory ?? 'throughput');

  const createMutation = useMutation(createWorkflowTaskMutation);
  const updateMutation = useMutation(updateWorkflowTaskMutation);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      name,
      estimatedMinutes,
      requiredRole: requiredRole || null,
      sortOrder,
      outputUnit,
      standardRatePerHour,
      kpiCategory
    };
    if (mode === 'edit') {
      await updateMutation.mutateAsync({ id: task.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {mode === 'create' ? (
          <Button size='sm'>
            <Icons.add className='mr-1 h-4 w-4' />
            Them dau viec
          </Button>
        ) : (
          <Button variant='ghost' size='icon' className='h-7 w-7'>
            <Icons.edit className='h-3.5 w-3.5' />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{mode === 'create' ? 'Them dau viec' : 'Sua dau viec'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className='mt-4 space-y-4'>
          <div className='flex flex-col gap-1'>
            <label htmlFor='workflow-name' className='text-sm font-medium'>
              Ten dau viec
            </label>
            <input
              id='workflow-name'
              className='rounded-md border px-3 py-2 text-sm'
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='flex flex-col gap-1'>
              <label htmlFor='workflow-minutes' className='text-sm font-medium'>
                Thoi gian tieu chuan (phut)
              </label>
              <input
                id='workflow-minutes'
                type='number'
                min={1}
                className='rounded-md border px-3 py-2 text-sm'
                required
                value={estimatedMinutes}
                onChange={(event) => setEstimatedMinutes(Number(event.target.value))}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label htmlFor='workflow-rate' className='text-sm font-medium'>
                Toc do tieu chuan / gio
              </label>
              <input
                id='workflow-rate'
                type='number'
                min={0.1}
                step={0.1}
                className='rounded-md border px-3 py-2 text-sm'
                required
                value={standardRatePerHour}
                onChange={(event) => setStandardRatePerHour(Number(event.target.value))}
              />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='flex flex-col gap-1'>
              <label htmlFor='workflow-role' className='text-sm font-medium'>
                Vai tro
              </label>
              <input
                id='workflow-role'
                className='rounded-md border px-3 py-2 text-sm'
                value={requiredRole}
                onChange={(event) => setRequiredRole(event.target.value)}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label htmlFor='workflow-unit' className='text-sm font-medium'>
                Don vi dau ra
              </label>
              <input
                id='workflow-unit'
                className='rounded-md border px-3 py-2 text-sm'
                value={outputUnit}
                onChange={(event) => setOutputUnit(event.target.value)}
              />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='flex flex-col gap-1'>
              <label htmlFor='workflow-kpi' className='text-sm font-medium'>
                Nhom KPI
              </label>
              <input
                id='workflow-kpi'
                className='rounded-md border px-3 py-2 text-sm'
                value={kpiCategory}
                onChange={(event) => setKpiCategory(event.target.value)}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label htmlFor='workflow-sort' className='text-sm font-medium'>
                Thu tu
              </label>
              <input
                id='workflow-sort'
                type='number'
                min={0}
                className='rounded-md border px-3 py-2 text-sm'
                value={sortOrder}
                onChange={(event) => setSortOrder(Number(event.target.value))}
              />
            </div>
          </div>
          <Button
            type='submit'
            className='w-full'
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {mode === 'create' ? 'Tao' : 'Luu'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
