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

  const createMut = useMutation(createWorkflowTaskMutation);
  const updateMut = useMutation(updateWorkflowTaskMutation);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name, estimatedMinutes, requiredRole: requiredRole || null, sortOrder };
    if (mode === 'edit') {
      await updateMut.mutateAsync({ id: task.id, ...payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {mode === 'create' ? (
          <Button size='sm'>
            <Icons.add className='mr-1 h-4 w-4' /> Thêm đầu việc
          </Button>
        ) : (
          <Button variant='ghost' size='icon' className='h-7 w-7'>
            <Icons.edit className='h-3.5 w-3.5' />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{mode === 'create' ? 'Thêm đầu việc' : 'Sửa đầu việc'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className='mt-4 space-y-4'>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Tên đầu việc</label>
            <input
              className='rounded-md border px-3 py-2 text-sm'
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Thời gian ước tính (phút)</label>
            <input
              type='number'
              min={1}
              className='rounded-md border px-3 py-2 text-sm'
              required
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Vai trò yêu cầu</label>
            <input
              className='rounded-md border px-3 py-2 text-sm'
              placeholder='Nhân viên pick, lái xe nâng...'
              value={requiredRole}
              onChange={(e) => setRequiredRole(e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Thứ tự hiển thị</label>
            <input
              type='number'
              min={0}
              className='rounded-md border px-3 py-2 text-sm'
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
          <Button
            type='submit'
            className='w-full'
            disabled={createMut.isPending || updateMut.isPending}
          >
            {mode === 'create' ? 'Tạo' : 'Lưu'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
