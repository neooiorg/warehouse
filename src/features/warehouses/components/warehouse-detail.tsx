'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { zoneListOptions, locationListOptions, dockListOptions } from '../api/queries';
import { useDeleteZone, useDeleteLocation, useDeleteDock } from '../api/mutations';
import ZoneFormSheet from './zone-form-sheet';
import LocationFormSheet from './location-form-sheet';
import DockFormSheet from './dock-form-sheet';

type Props = { warehouseId: string };

export default function WarehouseDetail({ warehouseId }: Props) {
  const { data: zones } = useSuspenseQuery(zoneListOptions(warehouseId));
  const { data: locs } = useSuspenseQuery(locationListOptions(warehouseId));
  const { data: dockList } = useSuspenseQuery(dockListOptions(warehouseId));

  const deleteZone = useDeleteZone(warehouseId);
  const deleteLoc = useDeleteLocation(warehouseId);
  const deleteDock = useDeleteDock(warehouseId);

  const directionLabel = { inbound: 'Nhập', outbound: 'Xuất', both: 'Hai chiều' };

  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button asChild variant='outline' size='sm'>
          <Link href={`/dashboard/warehouses/${warehouseId}/floor-plan`}>
            <Icons.location className='mr-2 h-4 w-4' />
            Sơ đồ 2D
          </Link>
        </Button>
      </div>

      <Tabs defaultValue='zones'>
        <TabsList>
          <TabsTrigger value='zones'>Khu vực ({zones.length})</TabsTrigger>
          <TabsTrigger value='locations'>Vị trí ({locs.length})</TabsTrigger>
          <TabsTrigger value='docks'>Cửa dock ({dockList.length})</TabsTrigger>
        </TabsList>

        {/* ZONES */}
        <TabsContent value='zones' className='space-y-3'>
          <div className='flex justify-end'>
            <ZoneFormSheet warehouseId={warehouseId}>
              <Button size='sm'>
                <Icons.add className='mr-2 h-4 w-4' />
                Thêm khu vực
              </Button>
            </ZoneFormSheet>
          </div>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên khu vực</TableHead>
                  <TableHead className='text-center'>Số vị trí</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((z) => (
                  <TableRow key={z.id}>
                    <TableCell>
                      <Badge variant='outline'>{z.code}</Badge>
                    </TableCell>
                    <TableCell>{z.name}</TableCell>
                    <TableCell className='text-center'>{z.locationCount}</TableCell>
                    <TableCell className='flex justify-end gap-1'>
                      <ZoneFormSheet warehouseId={warehouseId} zone={z}>
                        <Button size='icon' variant='ghost'>
                          <Icons.edit className='h-4 w-4' />
                        </Button>
                      </ZoneFormSheet>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='text-destructive hover:text-destructive'
                        onClick={() => deleteZone.mutate(z.id)}
                      >
                        <Icons.trash className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* LOCATIONS */}
        <TabsContent value='locations' className='space-y-3'>
          <div className='flex justify-end'>
            <LocationFormSheet warehouseId={warehouseId} zones={zones}>
              <Button size='sm'>
                <Icons.add className='mr-2 h-4 w-4' />
                Thêm vị trí
              </Button>
            </LocationFormSheet>
          </div>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Khu vực</TableHead>
                  <TableHead className='text-center'>Tầng</TableHead>
                  <TableHead className='text-center'>Tải tối đa (kg)</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {locs.map((loc) => {
                  const zone = zones.find((z) => z.id === loc.zoneId);
                  return (
                    <TableRow key={loc.id}>
                      <TableCell>
                        <Badge variant='outline'>{loc.code}</Badge>
                      </TableCell>
                      <TableCell>{loc.type === 'rack' ? 'Kệ rack' : 'Sàn'}</TableCell>
                      <TableCell>{zone?.code ?? '—'}</TableCell>
                      <TableCell className='text-center'>{loc.level ?? '—'}</TableCell>
                      <TableCell className='text-center'>{loc.capacityWeight ?? '—'}</TableCell>
                      <TableCell className='flex justify-end gap-1'>
                        <LocationFormSheet warehouseId={warehouseId} zones={zones} location={loc}>
                          <Button size='icon' variant='ghost'>
                            <Icons.edit className='h-4 w-4' />
                          </Button>
                        </LocationFormSheet>
                        <Button
                          size='icon'
                          variant='ghost'
                          className='text-destructive hover:text-destructive'
                          onClick={() => deleteLoc.mutate(loc.id)}
                        >
                          <Icons.trash className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* DOCKS */}
        <TabsContent value='docks' className='space-y-3'>
          <div className='flex justify-end'>
            <DockFormSheet warehouseId={warehouseId}>
              <Button size='sm'>
                <Icons.add className='mr-2 h-4 w-4' />
                Thêm cửa dock
              </Button>
            </DockFormSheet>
          </div>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã cửa</TableHead>
                  <TableHead>Chiều</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {dockList.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Badge variant='outline'>{d.code}</Badge>
                    </TableCell>
                    <TableCell>{directionLabel[d.direction]}</TableCell>
                    <TableCell className='flex justify-end gap-1'>
                      <DockFormSheet warehouseId={warehouseId} dock={d}>
                        <Button size='icon' variant='ghost'>
                          <Icons.edit className='h-4 w-4' />
                        </Button>
                      </DockFormSheet>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='text-destructive hover:text-destructive'
                        onClick={() => deleteDock.mutate(d.id)}
                      >
                        <Icons.trash className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
