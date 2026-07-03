'use client';

import { useState } from 'react';
import { useSuspenseQuery, useQuery } from '@tanstack/react-query';
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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    const res = await searchLotHistory(search, warehouseId || undefined);
    setSearchResults(res);
    setSearching(false);
  }

  const priorityColor: Record<string, string> = {
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
          onChange={(e) => setWarehouseId(e.target.value)}
        >
          <option value=''>-- Chọn kho --</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.code} — {w.name}
            </option>
          ))}
        </select>
      </div>

      {/* Reslotting suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm'>Đề xuất đảo vị trí lưu trữ</CardTitle>
        </CardHeader>
        <CardContent>
          {!warehouseId && (
            <p className='text-sm text-muted-foreground'>Chọn kho để xem đề xuất.</p>
          )}
          {warehouseId && isLoading && (
            <p className='text-sm text-muted-foreground'>Đang phân tích...</p>
          )}
          {warehouseId && !isLoading && suggestions.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              Không có đề xuất nào. Tất cả hàng hóa đang ở vị trí tối ưu.
            </p>
          )}
          <div className='space-y-2'>
            {suggestions.map((s: ReslottingSuggestion) => (
              <div key={s.lotId} className='flex items-start justify-between rounded-md border p-3'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium'>{s.lotNo}</span>
                    <Badge variant={priorityColor[s.priority] as any} className='text-xs'>
                      {s.priority === 'high'
                        ? 'Cao'
                        : s.priority === 'medium'
                          ? 'Trung bình'
                          : 'Thấp'}
                    </Badge>
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Vị trí hiện tại: {s.currentLocationCode ?? 'N/A'} (cách dock{' '}
                    {s.currentDistanceToDock ?? '?'} m)
                  </p>
                  <p className='text-xs'>{s.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lot history search */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm'>Tìm kiếm lịch sử kiện hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className='flex gap-3'>
            <input
              className='flex-1 rounded-md border px-3 py-2 text-sm'
              placeholder='Nhập mã lô, SKU hoặc tên hàng...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                    <th className='px-3 py-2 text-left font-medium'>Mã lô</th>
                    <th className='px-3 py-2 text-left font-medium'>SKU</th>
                    <th className='px-3 py-2 text-left font-medium'>Kho</th>
                    <th className='px-3 py-2 text-left font-medium'>Vị trí</th>
                    <th className='px-3 py-2 text-right font-medium'>SL</th>
                    <th className='px-3 py-2 text-left font-medium'>Ngày nhập</th>
                    <th className='px-3 py-2 text-left font-medium'>HSD</th>
                    <th className='px-3 py-2 text-left font-medium'>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.length === 0 && (
                    <tr>
                      <td colSpan={8} className='px-3 py-4 text-center text-muted-foreground'>
                        Không tìm thấy kết quả.
                      </td>
                    </tr>
                  )}
                  {searchResults.map((r) => (
                    <tr key={r.id} className='border-t'>
                      <td className='px-3 py-2 font-mono text-xs'>{r.lotNo}</td>
                      <td className='px-3 py-2'>{r.sku}</td>
                      <td className='px-3 py-2'>{r.warehouseCode}</td>
                      <td className='px-3 py-2'>{r.locationCode ?? '—'}</td>
                      <td className='px-3 py-2 text-right'>{r.qty}</td>
                      <td className='px-3 py-2 text-xs'>{r.receivedDate}</td>
                      <td className='px-3 py-2 text-xs'>{r.expiryDate ?? '—'}</td>
                      <td className='px-3 py-2'>
                        <Badge variant='outline' className='text-xs'>
                          {r.status}
                        </Badge>
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
