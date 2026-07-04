'use client';

import { useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { employeeOptionsQuery } from '@/features/master-data/api/queries';
import { workflowTasksQueryOptions } from '@/features/hr/api/queries';
import { importTaskLogsMutation, logTaskMutation } from '../api/mutations';

export function TaskLogSheet() {
  const [open, setOpen] = useState(false);
  const { data: tasks } = useSuspenseQuery(workflowTasksQueryOptions());
  const { data: employees } = useSuspenseQuery(employeeOptionsQuery());
  const logMutation = useMutation(logTaskMutation);
  const importMutation = useMutation(importTaskLogsMutation);
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await logMutation.mutateAsync({
      ...form,
      startedAt: new Date(form.startedAt).toISOString(),
      completedAt: new Date(form.completedAt).toISOString()
    });
    toast.success('Da ghi nhan task log.');
    setOpen(false);
  }

  function handleCsv(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const rows = result.data.map((row, index) => ({
          line: index + 2,
          employeeName: row.employeeName ?? '',
          taskName: row.taskName ?? '',
          startedAt: row.startedAt ?? '',
          completedAt: row.completedAt ?? '',
          qty: Number(row.qty ?? 0),
          unit: row.unit ?? '',
          warehouseCode: row.warehouseCode ?? '',
          note: row.note ?? ''
        }));
        const imported = await importMutation.mutateAsync(rows);
        if (imported.errors.length > 0) {
          toast.error(
            imported.errors.map((error) => `Dong ${error.line}: ${error.message}`).join(' | ')
          );
          return;
        }
        toast.success(`Da nhap ${imported.importedCount} dong.`);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size='sm'>
          <Icons.add className='mr-1 h-4 w-4' />
          Ghi nhan dau viec
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Ghi nhan dau viec</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className='mt-4 space-y-3'>
          <div className='rounded-md border border-dashed p-3 text-sm'>
            <div className='mb-1 font-medium'>Nhap nhanh bang CSV</div>
            <p className='text-muted-foreground mb-2 text-xs'>
              employeeName, taskName, startedAt, completedAt, qty, unit, warehouseCode, note
            </p>
            <input
              type='file'
              accept='.csv'
              onChange={(event) => event.target.files?.[0] && handleCsv(event.target.files[0])}
            />
          </div>

          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Nhan vien</label>
            <select
              className='rounded-md border px-3 py-2 text-sm'
              required
              value={form.employeeId}
              onChange={(event) =>
                setForm((current) => ({ ...current, employeeId: event.target.value }))
              }
            >
              <option value=''>-- Chon nhan vien --</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName} {employee.role ? `(${employee.role})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Dau viec</label>
            <select
              className='rounded-md border px-3 py-2 text-sm'
              required
              value={form.taskTypeId}
              onChange={(event) => {
                const task = tasks.find((item) => item.id === event.target.value);
                setForm((current) => ({
                  ...current,
                  taskTypeId: event.target.value,
                  unit: task?.outputUnit ?? current.unit
                }));
              }}
            >
              <option value=''>-- Chon dau viec --</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>

          <div className='flex gap-3'>
            <div className='flex flex-1 flex-col gap-1'>
              <label className='text-sm font-medium'>Bat dau</label>
              <input
                type='datetime-local'
                className='rounded-md border px-3 py-2 text-sm'
                value={form.startedAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startedAt: event.target.value }))
                }
              />
            </div>
            <div className='flex flex-1 flex-col gap-1'>
              <label className='text-sm font-medium'>Hoan thanh</label>
              <input
                type='datetime-local'
                className='rounded-md border px-3 py-2 text-sm'
                value={form.completedAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, completedAt: event.target.value }))
                }
              />
            </div>
          </div>

          <div className='flex gap-3'>
            <div className='flex flex-1 flex-col gap-1'>
              <label className='text-sm font-medium'>So luong</label>
              <input
                type='number'
                min={0}
                step={0.1}
                className='rounded-md border px-3 py-2 text-sm'
                value={form.qty}
                onChange={(event) =>
                  setForm((current) => ({ ...current, qty: Number(event.target.value) }))
                }
              />
            </div>
            <div className='flex flex-1 flex-col gap-1'>
              <label className='text-sm font-medium'>Don vi</label>
              <input
                className='rounded-md border px-3 py-2 text-sm'
                value={form.unit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, unit: event.target.value }))
                }
              />
            </div>
          </div>

          <Button type='submit' className='w-full' disabled={logMutation.isPending}>
            Luu
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
