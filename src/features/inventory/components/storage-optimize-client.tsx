'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { queryOptions } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { warehouseOptionsQuery } from '@/features/master-data/api/queries';
import { getStorageOptimizationAdvice, searchLotHistory } from '../api/service';
import type { ReslottingSuggestion } from '../utils/reslotting';

function optimizeQueryOptions(warehouseId: string) {
  return queryOptions({
    queryKey: ['inventory', 'optimize', warehouseId],
    queryFn: () => getStorageOptimizationAdvice(warehouseId),
    enabled: !!warehouseId
  });
}

export function StorageOptimizeClient() {
  const { data: warehouses } = useSuspenseQuery(warehouseOptionsQuery());
  const [warehouseId, setWarehouseId] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Awaited<
    ReturnType<typeof searchLotHistory>
  > | null>(null);
  const [searching, setSearching] = useState(false);
  const { data: suggestions = [], isLoading } = useQuery(optimizeQueryOptions(warehouseId));

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    const results = await searchLotHistory(search, warehouseId || undefined);
    setSearchResults(results);
    setSearching(false);
  }

  const priorityVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary'
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <select
          className='rounded-md border px-3 py-2 text-sm'
          value={warehouseId}
          onChange={(event) => setWarehouseId(event.target.value)}
        >
          <option value=''>-- Chon kho --</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.code} - {warehouse.name}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-sm'>De xuat dao vi tri luu tru</CardTitle>
        </CardHeader>
        <CardContent>
          {!warehouseId && (
            <p className='text-sm text-muted-foreground'>Chon kho de xem de xuat.</p>
          )}
          {warehouseId && isLoading && (
            <p className='text-sm text-muted-foreground'>Dang phan tich...</p>
          )}
          {warehouseId && !isLoading && suggestions.length === 0 && (
            <p className='text-sm text-muted-foreground'>Chua co de xuat moi cho kho nay.</p>
          )}
          <div className='space-y-2'>
            {suggestions.map((suggestion: ReslottingSuggestion) => (
              <div key={suggestion.lotId} className='rounded-md border p-3'>
                <div className='mb-2 flex items-center gap-2'>
                  <span className='text-sm font-medium'>{suggestion.lotNo}</span>
                  <Badge variant={priorityVariant[suggestion.priority]}>
                    {suggestion.priority}
                  </Badge>
                  <Badge variant='outline'>{suggestion.ruleApplied}</Badge>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Hien tai: {suggestion.currentLocationCode ?? 'N/A'} | De xuat:{' '}
                  {suggestion.recommendedLocationCode ?? 'N/A'}
                </p>
                <p className='text-xs text-muted-foreground'>
                  Khoang cach dock hien tai: {suggestion.currentDistanceToDock ?? '?'} m
                </p>
                <p className='mt-1 text-xs'>{suggestion.reason}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-sm'>Tim lich su kien hang</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className='flex gap-3'>
            <input
              aria-label='Tim lot SKU hoac ten hang'
              className='flex-1 rounded-md border px-3 py-2 text-sm'
              placeholder='Nhap lot, SKU hoac ten hang'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button type='submit' disabled={searching}>
              {searching ? (
                <Icons.spinner className='h-4 w-4 animate-spin' />
              ) : (
                <Icons.search className='h-4 w-4' />
              )}
            </Button>
          </form>
          {searchResults !== null && (
            <div className='mt-4 overflow-x-auto rounded-lg border'>
              <table className='w-full text-sm'>
                <thead className='bg-muted/50'>
                  <tr>
                    <th className='px-3 py-2 text-left font-medium'>Lot</th>
                    <th className='px-3 py-2 text-left font-medium'>SKU</th>
                    <th className='px-3 py-2 text-left font-medium'>Kho</th>
                    <th className='px-3 py-2 text-left font-medium'>Vi tri</th>
                    <th className='px-3 py-2 text-right font-medium'>So luong</th>
                    <th className='px-3 py-2 text-left font-medium'>Trace</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.length === 0 && (
                    <tr>
                      <td colSpan={6} className='px-3 py-4 text-center text-muted-foreground'>
                        Khong tim thay ket qua.
                      </td>
                    </tr>
                  )}
                  {searchResults.map((row) => (
                    <tr key={row.id} className='border-t'>
                      <td className='px-3 py-2 font-mono text-xs'>{row.lotNo}</td>
                      <td className='px-3 py-2'>{row.sku}</td>
                      <td className='px-3 py-2'>{row.warehouseCode}</td>
                      <td className='px-3 py-2'>{row.locationCode ?? '-'}</td>
                      <td className='px-3 py-2 text-right'>{row.qty}</td>
                      <td className='px-3 py-2'>
                        <Link
                          href={`/dashboard/inventory/traceability`}
                          className='text-xs text-primary underline'
                        >
                          Mo traceability
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
