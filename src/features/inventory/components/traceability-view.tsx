'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { lotsQueryOptions, transactionsQueryOptions } from '../api/queries';
import { warehouseOptionsQuery, locationOptionsQuery } from '@/features/master-data/api/queries';
import { TransactionTimeline } from './transaction-timeline';

function LotTraceability() {
  const [search, setSearch] = useState('');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  const { data: lotResults } = useQuery({
    ...lotsQueryOptions({ search, limit: 20 }),
    enabled: search.length > 1
  });

  const { data: history } = useQuery({
    ...transactionsQueryOptions({ lotId: selectedLotId ?? undefined, order: 'asc', limit: 100 }),
    enabled: !!selectedLotId
  });

  return (
    <div className='grid gap-4 md:grid-cols-2'>
      <div className='space-y-3'>
        <div className='relative'>
          <Icons.search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='Tìm theo mã lô hoặc SKU'
            className='pl-9'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedLotId(null);
            }}
          />
        </div>
        <div className='space-y-2'>
          {(lotResults?.data ?? []).map((lot) => (
            <button
              key={lot.id}
              type='button'
              onClick={() => setSelectedLotId(lot.id)}
              className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                selectedLotId === lot.id ? 'border-primary bg-muted' : 'hover:bg-muted/50'
              }`}
            >
              <div className='font-medium'>
                {lot.lotNo} — {lot.sku}
              </div>
              <div className='text-muted-foreground text-xs'>
                {lot.skuName} · SL {lot.qty} · {lot.locationCode ?? 'chưa có vị trí'} ·{' '}
                {lot.warehouseCode}
              </div>
            </button>
          ))}
          {search.length > 1 && (lotResults?.data.length ?? 0) === 0 && (
            <p className='text-muted-foreground py-4 text-center text-sm'>Không tìm thấy lô.</p>
          )}
        </div>
      </div>

      <Card>
        <CardContent className='pt-6'>
          {selectedLotId ? (
            <TransactionTimeline transactions={history?.data ?? []} />
          ) : (
            <p className='text-muted-foreground py-8 text-center text-sm'>
              Chọn một lô để xem toàn bộ lịch sử di chuyển.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LocationTraceability() {
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');

  const { data: warehouses = [] } = useQuery(warehouseOptionsQuery());
  const { data: locations = [] } = useQuery(locationOptionsQuery(warehouseId));

  const { data: history } = useQuery({
    ...transactionsQueryOptions({ locationId: locationId || undefined, order: 'asc', limit: 100 }),
    enabled: !!locationId
  });

  return (
    <div className='grid gap-4 md:grid-cols-2'>
      <div className='space-y-3'>
        <div className='space-y-2'>
          <FieldLabel htmlFor='trace-warehouse'>Kho</FieldLabel>
          <Select
            value={warehouseId}
            onValueChange={(value) => {
              setWarehouseId(value);
              setLocationId('');
            }}
          >
            <SelectTrigger id='trace-warehouse'>
              <SelectValue placeholder='Chọn kho' />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.code} — {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <FieldLabel htmlFor='trace-location'>Vị trí</FieldLabel>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger id='trace-location'>
              <SelectValue placeholder={warehouseId ? 'Chọn vị trí' : 'Chọn kho trước'} />
            </SelectTrigger>
            <SelectContent>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className='pt-6'>
          {locationId ? (
            <TransactionTimeline transactions={history?.data ?? []} />
          ) : (
            <p className='text-muted-foreground py-8 text-center text-sm'>
              Chọn vị trí để xem toàn bộ hàng đã nhập hoặc xuất khỏi vị trí này.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function TraceabilityView() {
  return (
    <Tabs defaultValue='lot'>
      <TabsList>
        <TabsTrigger value='lot'>Theo lô</TabsTrigger>
        <TabsTrigger value='location'>Theo vị trí</TabsTrigger>
      </TabsList>
      <TabsContent value='lot' className='mt-4'>
        <LotTraceability />
      </TabsContent>
      <TabsContent value='location' className='mt-4'>
        <LocationTraceability />
      </TabsContent>
    </Tabs>
  );
}
