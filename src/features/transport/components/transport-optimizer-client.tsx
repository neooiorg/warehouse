'use client';

import { useState } from 'react';
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { productSkuOptionsQuery } from '@/features/master-data/api/queries';
import { findSourceWarehousesMutation, createShipmentRequestMutation } from '../api/mutations';
import type { RouteOption } from '../api/types';

export function TransportOptimizerClient() {
  const { data: skus } = useSuspenseQuery(productSkuOptionsQuery());
  const findMut = useMutation(findSourceWarehousesMutation);
  const createMut = useMutation(createShipmentRequestMutation);

  const [form, setForm] = useState({
    skuId: '',
    qtyRequired: 1,
    destinationLat: 21.0245,
    destinationLng: 105.8412,
    destinationAddress: ''
  });
  const [results, setResults] = useState<RouteOption[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  async function handleFind(e: React.FormEvent) {
    e.preventDefault();
    const res = await findMut.mutateAsync(form);
    setResults(res);
    setSelected(null);
  }

  async function handleFulfill(warehouseId: string) {
    await createMut.mutateAsync({
      skuId: form.skuId,
      qtyRequired: form.qtyRequired,
      destinationLat: form.destinationLat,
      destinationLng: form.destinationLng,
      destinationAddress: form.destinationAddress,
      requestDate: new Date().toISOString().split('T')[0]
    });
    setSelected(warehouseId);
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader><CardTitle className='text-sm'>Yêu cầu tìm kho nguồn</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleFind} className='flex flex-wrap gap-4'>
            <div className='flex flex-col gap-1'>
              <label className='text-sm font-medium'>SKU hàng hóa</label>
              <select className='rounded-md border px-3 py-2 text-sm' required value={form.skuId} onChange={(e) => setForm((f) => ({ ...f, skuId: e.target.value }))}>
                <option value=''>-- Chọn SKU --</option>
                {skus.map((s) => <option key={s.id} value={s.id}>{s.sku} — {s.name}</option>)}
              </select>
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-sm font-medium'>Số lượng cần</label>
              <input type='number' min={1} step={0.1} className='w-28 rounded-md border px-3 py-2 text-sm' value={form.qtyRequired} onChange={(e) => setForm((f) => ({ ...f, qtyRequired: Number(e.target.value) }))} />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-sm font-medium'>Vĩ độ đích</label>
              <input type='number' step='any' className='w-32 rounded-md border px-3 py-2 text-sm' value={form.destinationLat} onChange={(e) => setForm((f) => ({ ...f, destinationLat: Number(e.target.value) }))} />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-sm font-medium'>Kinh độ đích</label>
              <input type='number' step='any' className='w-32 rounded-md border px-3 py-2 text-sm' value={form.destinationLng} onChange={(e) => setForm((f) => ({ ...f, destinationLng: Number(e.target.value) }))} />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-sm font-medium'>Địa chỉ đích (tùy chọn)</label>
              <input className='w-64 rounded-md border px-3 py-2 text-sm' placeholder='Địa chỉ giao hàng...' value={form.destinationAddress} onChange={(e) => setForm((f) => ({ ...f, destinationAddress: e.target.value }))} />
            </div>
            <div className='flex items-end'>
              <Button type='submit' disabled={findMut.isPending}>
                {findMut.isPending ? <Icons.spinner className='mr-2 h-4 w-4 animate-spin' /> : <Icons.search className='mr-2 h-4 w-4' />}
                Tìm kho nguồn
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {results !== null && (
        <Card>
          <CardHeader><CardTitle className='text-sm'>Kết quả gợi ý ({results.length} kho)</CardTitle></CardHeader>
          <CardContent>
            {results.length === 0 && <p className='text-sm text-muted-foreground'>Không có kho nào đủ tồn kho cho yêu cầu này.</p>}
            <div className='space-y-3'>
              {results.map((r, i) => (
                <div key={r.warehouseId} className={`flex items-center justify-between rounded-md border p-3 ${selected === r.warehouseId ? 'border-primary bg-primary/5' : ''}`}>
                  <div className='flex items-center gap-3'>
                    <span className='text-lg font-bold text-muted-foreground'>#{i + 1}</span>
                    <div>
                      <p className='text-sm font-medium'>{r.warehouseCode} — {r.warehouseName}</p>
                      <div className='mt-1 flex gap-2 text-xs text-muted-foreground'>
                        <span>Tồn: <strong className='text-foreground'>{r.availableQty}</strong></span>
                        <span>Khoảng cách: <strong className='text-foreground'>{r.distanceKm} km</strong></span>
                        <span>Thời gian dự kiến: <strong className='text-foreground'>{r.estimatedHours.toFixed(1)} giờ</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {i === 0 && <Badge className='text-xs'>Tối ưu nhất</Badge>}
                    <Button size='sm' variant={selected === r.warehouseId ? 'secondary' : 'outline'} onClick={() => handleFulfill(r.warehouseId)} disabled={createMut.isPending || !!selected}>
                      {selected === r.warehouseId ? 'Đã chọn' : 'Chọn kho này'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
