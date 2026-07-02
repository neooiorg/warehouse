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
            placeholder='Search by lot number or SKU'
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
                {lot.skuName} · qty {lot.qty} · {lot.locationCode ?? 'no location'} ·{' '}
                {lot.warehouseCode}
              </div>
            </button>
          ))}
          {search.length > 1 && (lotResults?.data.length ?? 0) === 0 && (
            <p className='text-muted-foreground py-4 text-center text-sm'>No lots found.</p>
          )}
        </div>
      </div>

      <Card>
        <CardContent className='pt-6'>
          {selectedLotId ? (
            <TransactionTimeline transactions={history?.data ?? []} />
          ) : (
            <p className='text-muted-foreground py-8 text-center text-sm'>
              Select a lot to view its full movement history.
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
          <FieldLabel htmlFor='trace-warehouse'>Warehouse</FieldLabel>
          <Select
            value={warehouseId}
            onValueChange={(value) => {
              setWarehouseId(value);
              setLocationId('');
            }}
          >
            <SelectTrigger id='trace-warehouse'>
              <SelectValue placeholder='Select warehouse' />
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
          <FieldLabel htmlFor='trace-location'>Location</FieldLabel>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger id='trace-location'>
              <SelectValue
                placeholder={warehouseId ? 'Select location' : 'Select a warehouse first'}
              />
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
              Select a location to view everything that has moved in or out of it.
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
        <TabsTrigger value='lot'>By Lot</TabsTrigger>
        <TabsTrigger value='location'>By Location</TabsTrigger>
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
