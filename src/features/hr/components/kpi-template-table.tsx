'use client';

import { useState } from 'react';
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { kpiTemplatesQueryOptions } from '../api/queries';
import { upsertKpiTemplateMutation, deleteKpiTemplateMutation } from '../api/mutations';
import type { KpiTemplate } from '../api/types';

function KpiSheet({ kpi }: { kpi?: KpiTemplate }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    role: kpi?.role ?? '',
    kpiName: kpi?.kpiName ?? '',
    formula: kpi?.formula ?? '',
    target: kpi?.target ?? 0,
    unit: kpi?.unit ?? '',
    weight: kpi?.weight ?? 1
  });
  const upsert = useMutation(upsertKpiTemplateMutation);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await upsert.mutateAsync({ id: kpi?.id, ...form });
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {kpi ? (
          <Button variant='ghost' size='icon' className='h-7 w-7'><Icons.edit className='h-3.5 w-3.5' /></Button>
        ) : (
          <Button size='sm'><Icons.add className='mr-1 h-4 w-4' />Thêm KPI</Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader><SheetTitle>{kpi ? 'Sửa KPI' : 'Thêm KPI'}</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit} className='mt-4 space-y-3'>
          {(['role', 'kpiName', 'formula', 'unit'] as const).map((field) => (
            <div key={field} className='flex flex-col gap-1'>
              <label className='text-sm font-medium capitalize'>{field === 'kpiName' ? 'Tên KPI' : field === 'formula' ? 'Công thức' : field === 'unit' ? 'Đơn vị' : 'Vai trò'}</label>
              <input className='rounded-md border px-3 py-2 text-sm' value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} />
            </div>
          ))}
          <div className='flex gap-3'>
            <div className='flex flex-1 flex-col gap-1'>
              <label className='text-sm font-medium'>Mục tiêu</label>
              <input type='number' className='rounded-md border px-3 py-2 text-sm' value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: Number(e.target.value) }))} />
            </div>
            <div className='flex flex-1 flex-col gap-1'>
              <label className='text-sm font-medium'>Trọng số</label>
              <input type='number' step={0.1} min={0} max={10} className='rounded-md border px-3 py-2 text-sm' value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: Number(e.target.value) }))} />
            </div>
          </div>
          <Button type='submit' className='w-full' disabled={upsert.isPending}>{kpi ? 'Lưu' : 'Tạo'}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function KpiTemplateTable() {
  const { data } = useSuspenseQuery(kpiTemplatesQueryOptions());
  const deleteMut = useMutation(deleteKpiTemplateMutation);

  const roles = [...new Set(data.map((k) => k.role))];

  return (
    <div className='space-y-4'>
      <div className='flex justify-end'><KpiSheet /></div>
      {roles.map((role) => (
        <Card key={role}>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>{role}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {data.filter((k) => k.role === role).map((k) => (
                <div key={k.id} className='flex items-start justify-between rounded-md border p-3'>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium'>{k.kpiName}</p>
                    {k.formula && <p className='font-mono text-xs text-muted-foreground'>{k.formula}</p>}
                    <div className='flex gap-2'>
                      {k.target != null && <Badge variant='outline' className='text-xs'>Target: {k.target} {k.unit}</Badge>}
                      <Badge variant='secondary' className='text-xs'>Trọng số: {k.weight}</Badge>
                    </div>
                  </div>
                  <div className='flex gap-1'>
                    <KpiSheet kpi={k} />
                    <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => deleteMut.mutate(k.id)}>
                      <Icons.trash className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      {data.length === 0 && <p className='text-sm text-muted-foreground'>Chưa có KPI nào. Thêm KPI để theo dõi hiệu quả nhân sự.</p>}
    </div>
  );
}
