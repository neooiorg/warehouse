'use client';

import { useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { productSkuOptionsQuery } from '@/features/master-data/api/queries';
import { createShipmentRequestMutation, findSourceWarehousesMutation } from '../api/mutations';
import type { RouteOption } from '../api/types';

export function TransportOptimizerClient() {
  const { data: skus } = useSuspenseQuery(productSkuOptionsQuery());
  const findMutation = useMutation(findSourceWarehousesMutation);
  const createMutation = useMutation(createShipmentRequestMutation);

  const [form, setForm] = useState({
    skuId: '',
    qtyRequired: 1,
    destinationLat: 21.0245,
    destinationLng: 105.8412,
    destinationAddress: ''
  });
  const [results, setResults] = useState<RouteOption[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  async function handleFind(event: React.FormEvent) {
    event.preventDefault();
    const nextResults = await findMutation.mutateAsync(form);
    setResults(nextResults);
    setSelected(null);
  }

  async function handleCreate(option: RouteOption) {
    await createMutation.mutateAsync({
      skuId: form.skuId,
      qtyRequired: form.qtyRequired,
      destinationLat: form.destinationLat,
      destinationLng: form.destinationLng,
      destinationAddress: form.destinationAddress,
      requestDate: new Date().toISOString().split('T')[0],
      warehouseId: option.coverageMode === 'single' ? option.warehouseId : null
    });
    setSelected(option.warehouseId);
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-sm'>Tim kho nguon toi uu</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFind} className='flex flex-wrap gap-4'>
            <div className='flex flex-col gap-1'>
              <label htmlFor='transport-sku' className='text-sm font-medium'>
                SKU
              </label>
              <select
                id='transport-sku'
                className='rounded-md border px-3 py-2 text-sm'
                required
                value={form.skuId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, skuId: event.target.value }))
                }
              >
                <option value=''>-- Chon SKU --</option>
                {skus.map((sku) => (
                  <option key={sku.id} value={sku.id}>
                    {sku.sku} - {sku.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex flex-col gap-1'>
              <label htmlFor='transport-qty' className='text-sm font-medium'>
                So luong
              </label>
              <input
                id='transport-qty'
                type='number'
                min={1}
                step={0.1}
                className='w-28 rounded-md border px-3 py-2 text-sm'
                value={form.qtyRequired}
                onChange={(event) =>
                  setForm((current) => ({ ...current, qtyRequired: Number(event.target.value) }))
                }
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label htmlFor='transport-lat' className='text-sm font-medium'>
                Vi do dich
              </label>
              <input
                id='transport-lat'
                type='number'
                step='any'
                className='w-32 rounded-md border px-3 py-2 text-sm'
                value={form.destinationLat}
                onChange={(event) =>
                  setForm((current) => ({ ...current, destinationLat: Number(event.target.value) }))
                }
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label htmlFor='transport-lng' className='text-sm font-medium'>
                Kinh do dich
              </label>
              <input
                id='transport-lng'
                type='number'
                step='any'
                className='w-32 rounded-md border px-3 py-2 text-sm'
                value={form.destinationLng}
                onChange={(event) =>
                  setForm((current) => ({ ...current, destinationLng: Number(event.target.value) }))
                }
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label htmlFor='transport-address' className='text-sm font-medium'>
                Dia chi dich
              </label>
              <input
                id='transport-address'
                className='w-64 rounded-md border px-3 py-2 text-sm'
                value={form.destinationAddress}
                onChange={(event) =>
                  setForm((current) => ({ ...current, destinationAddress: event.target.value }))
                }
              />
            </div>
            <div className='flex items-end'>
              <Button type='submit' disabled={findMutation.isPending}>
                {findMutation.isPending ? (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Icons.search className='mr-2 h-4 w-4' />
                )}
                Tim kho nguon
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {results !== null && (
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Phuong an de xuat ({results.length})</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {results.length === 0 && (
              <p className='text-sm text-muted-foreground'>
                Khong co ton kha dung cho yeu cau nay.
              </p>
            )}
            {results.map((option, index) => (
              <div
                key={`${option.warehouseId}-${option.coverageMode}-${index}`}
                className={`rounded-md border p-3 ${selected === option.warehouseId ? 'border-primary bg-primary/5' : ''}`}
              >
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium'>
                        {option.warehouseCode} - {option.warehouseName}
                      </span>
                      <Badge variant={index === 0 ? 'default' : 'outline'}>
                        {option.coverageMode === 'single' ? 'Single source' : 'Multi source'}
                      </Badge>
                    </div>
                    <div className='flex flex-wrap gap-3 text-xs text-muted-foreground'>
                      <span>
                        Ton kha dung:{' '}
                        <strong className='text-foreground'>{option.availableQty}</strong>
                      </span>
                      <span>
                        Phu duoc: <strong className='text-foreground'>{option.coveredQty}</strong>
                      </span>
                      <span>
                        Quang duong:{' '}
                        <strong className='text-foreground'>{option.distanceKm} km</strong>
                      </span>
                      <span>
                        ETA:{' '}
                        <strong className='text-foreground'>
                          {option.estimatedHours.toFixed(1)} h
                        </strong>
                      </span>
                      <span>
                        Nhien lieu:{' '}
                        <strong className='text-foreground'>
                          {option.fuelCostEstimate.toLocaleString('vi-VN')}d
                        </strong>
                      </span>
                      <span>
                        Cuoc noi bo:{' '}
                        <strong className='text-foreground'>
                          {option.freightCostEstimate.toLocaleString('vi-VN')}d
                        </strong>
                      </span>
                    </div>
                    {option.routeWarehouseIds.length > 1 && (
                      <div className='text-xs text-muted-foreground'>
                        Tuyen lay hang: {option.routeWarehouseIds.join(' -> ')}
                      </div>
                    )}
                  </div>
                  <Button
                    size='sm'
                    variant={selected === option.warehouseId ? 'secondary' : 'outline'}
                    onClick={() => handleCreate(option)}
                    disabled={createMutation.isPending || !!selected}
                  >
                    {selected === option.warehouseId ? 'Da tao yeu cau' : 'Tao yeu cau'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
