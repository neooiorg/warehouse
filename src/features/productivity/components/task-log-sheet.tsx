'use client';

import { useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { logTaskMutation } from '../api/mutations';
import { workflowTasksQueryOptions } from '@/features/hr/api/queries';
import { employeeOptionsQuery } from '@/features/master-data/api/queries';

export function TaskLogSheet() {
  const [open, setOpen] = useState(false);
  const { data: tasks } = useSuspenseQuery(workflowTasksQueryOptions());
  const { data: employees } = useSuspenseQuery(employeeOptionsQuery());
  const logMut = useMutation(logTaskMutation);
  const now = new Date().toISOString().slice(0, 16);

  const [form, setForm] = useState({
    warehouseId: '',
    employeeId: '',
    taskTypeId: '',
    startedAt: now,
    completedAt: now,
    qty: 1,
    unit: 'pallet',
    note: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await logMut.mutateAsync({ ...form, startedAt: new Date(form.startedAt).toISOString(), completedAt: new Date(form.completedAt).toISOString() });
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size='sm'><Icons.add className='mr-1 h-4 w-4' />Ghi nhận đầu việc</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader><SheetTitle>Ghi nhận đầu việc</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit} className='mt-4 space-y-3'>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Nhân viên</label>
            <select className='rounded-md border px-3 py-2 text-sm' required value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}>
              <option value=''>-- Chọn nhân viên --</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName} {e.role ? `(${e.role})` : ''}</option>)}
            </select>
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Loại đầu việc</label>
            <select className='rounded-md border px-3 py-2 text-sm' required value={form.taskTypeId} onChange={(e) => setForm((f) => ({ ...f, taskTypeId: e.target.value }))}>
              <option value=''>-- Chọn đầu việc --</option>
              {tasks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className='flex gap-3'>
            <div className='flex flex-1 flex-col gap-1'>
              <label className='text-sm font-medium'>Bắt đầu</label>
              <input type='datetime-local' className='rounded-md border px-3 py-2 text-sm' value={form.startedAt} onChange={(e) => setForm((f) => ({ ...f, startedAt: e.target.value }))} />
            </div>
            <div className='flex flex-1 flex-col gap-1'>
              <label className='text-sm font-medium'>Hoàn thành</label>
              <input type='datetime-local' className='rounded-md border px-3 py-2 text-sm' value={form.completedAt} onChange={(e) => setForm((f) => ({ ...f, completedAt: e.target.value }))} />
            </div>
          </div>
          <div className='flex gap-3'>
            <div className='flex flex-1 flex-col gap-1'>
              <label className='text-sm font-medium'>Số lượng</label>
              <input type='number' min={0} step={0.1} className='rounded-md border px-3 py-2 text-sm' value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: Number(e.target.value) }))} />
            </div>
            <div className='flex flex-1 flex-col gap-1'>
              <label className='text-sm font-medium'>Đơn vị</label>
              <input className='rounded-md border px-3 py-2 text-sm' value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
            </div>
          </div>
          <Button type='submit' className='w-full' disabled={logMut.isPending}>Lưu</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
