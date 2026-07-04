'use client';

import { useRef, useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { warehouseOptionsQuery } from '@/features/master-data/api/queries';
import { computeDockScheduleMutation } from '../api/mutations';
import type { DockAssignment, VehicleSlot } from '../api/types';

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function DockPageClient() {
  const { data: warehouses } = useSuspenseQuery(warehouseOptionsQuery());
  const computeMutation = useMutation(computeDockScheduleMutation);
  const fileRef = useRef<HTMLInputElement>(null);

  const [warehouseId, setWarehouseId] = useState('');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [forkliftsCount, setForkliftsCount] = useState(2);
  const [minutesPerPallet, setMinutesPerPallet] = useState(5);
  const [vehicles, setVehicles] = useState<VehicleSlot[]>([]);
  const [result, setResult] = useState<{
    assignments: DockAssignment[];
    docks: { id: string; code: string }[];
    avgWaitMinutes: number;
    totalCompletionMinutes: number;
    utilizationByDock: Record<string, number>;
    overloadWarnings: string[];
  } | null>(null);

  function addVehicle() {
    setVehicles((current) => [
      ...current,
      { plateNumber: '', arrivalTime: '08:00', palletCount: 10, direction: 'inbound' }
    ]);
  }

  function updateVehicle(index: number, patch: Partial<VehicleSlot>) {
    setVehicles((current) =>
      current.map((vehicle, currentIndex) =>
        currentIndex === index ? { ...vehicle, ...patch } : vehicle
      )
    );
  }

  function removeVehicle(index: number) {
    setVehicles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function handleCsv(file: File) {
    Papa.parse<string[]>(file, {
      complete: (result) => {
        const rows = result.data.slice(1).filter((row) => row[0]);
        const nextVehicles: VehicleSlot[] = [];
        const errors: string[] = [];

        rows.forEach((row, index) => {
          const direction = row[3] === 'inbound' || row[3] === 'outbound' ? row[3] : undefined;
          if (!row[0] || !row[1] || !direction || !(Number(row[2]) > 0)) {
            errors.push(
              `Dong ${index + 2} phai theo schema plateNumber,arrivalTime,palletCount,direction.`
            );
            return;
          }
          nextVehicles.push({
            plateNumber: row[0],
            arrivalTime: row[1],
            palletCount: Number(row[2]),
            direction
          });
        });

        if (errors.length > 0) {
          toast.error(errors.join(' | '));
          return;
        }

        setVehicles(nextVehicles);
      }
    });
  }

  async function handleCompute() {
    const computed = await computeMutation.mutateAsync({
      warehouseId,
      scheduleDate,
      forkliftsCount,
      minutesPerPallet,
      vehicles
    });
    setResult(computed);
  }

  const allTimes =
    result?.assignments.flatMap((assignment) => [
      timeToMinutes(assignment.startTime),
      timeToMinutes(assignment.endTime)
    ]) ?? [];
  const minTime = allTimes.length > 0 ? Math.min(...allTimes) : 480;
  const maxTime = allTimes.length > 0 ? Math.max(...allTimes) : 1080;
  const range = maxTime - minTime || 60;

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-sm'>Thong so tinh lich dock</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-4'>
          <div className='flex flex-col gap-1'>
            <label htmlFor='dock-warehouse' className='text-sm font-medium'>
              Kho
            </label>
            <select
              id='dock-warehouse'
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
          <div className='flex flex-col gap-1'>
            <label htmlFor='dock-date' className='text-sm font-medium'>
              Ngay
            </label>
            <input
              id='dock-date'
              type='date'
              className='rounded-md border px-3 py-2 text-sm'
              value={scheduleDate}
              onChange={(event) => setScheduleDate(event.target.value)}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label htmlFor='dock-forklifts' className='text-sm font-medium'>
              So xe nang
            </label>
            <input
              id='dock-forklifts'
              type='number'
              min={1}
              className='w-20 rounded-md border px-3 py-2 text-sm'
              value={forkliftsCount}
              onChange={(event) => setForkliftsCount(Number(event.target.value))}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label htmlFor='dock-minutes' className='text-sm font-medium'>
              Phut / pallet
            </label>
            <input
              id='dock-minutes'
              type='number'
              min={1}
              step={0.5}
              className='w-24 rounded-md border px-3 py-2 text-sm'
              value={minutesPerPallet}
              onChange={(event) => setMinutesPerPallet(Number(event.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='text-sm'>Danh sach xe ({vehicles.length})</CardTitle>
          <div className='flex gap-2'>
            <input
              ref={fileRef}
              type='file'
              accept='.csv'
              className='hidden'
              aria-label='Chon file CSV lich dock'
              onChange={(event) => event.target.files?.[0] && handleCsv(event.target.files[0])}
            />
            <Button variant='outline' size='sm' onClick={() => fileRef.current?.click()}>
              <Icons.upload className='mr-1 h-4 w-4' />
              Nhap CSV
            </Button>
            <Button size='sm' onClick={addVehicle}>
              <Icons.add className='mr-1 h-4 w-4' />
              Them xe
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              Schema CSV: plateNumber, arrivalTime, palletCount, direction.
            </p>
          )}
          <div className='space-y-2'>
            {vehicles.map((vehicle, index) => (
              <div
                key={index}
                className='flex flex-wrap items-center gap-2 rounded-md border px-3 py-2'
              >
                <input
                  aria-label='Bien so xe'
                  placeholder='Bien so'
                  className='w-28 rounded border px-2 py-1 text-xs'
                  value={vehicle.plateNumber}
                  onChange={(event) => updateVehicle(index, { plateNumber: event.target.value })}
                />
                <input
                  type='time'
                  aria-label='Gio den'
                  className='rounded border px-2 py-1 text-xs'
                  value={vehicle.arrivalTime}
                  onChange={(event) => updateVehicle(index, { arrivalTime: event.target.value })}
                />
                <input
                  type='number'
                  min={1}
                  aria-label='So pallet'
                  className='w-16 rounded border px-2 py-1 text-xs'
                  value={vehicle.palletCount}
                  onChange={(event) =>
                    updateVehicle(index, { palletCount: Number(event.target.value) })
                  }
                />
                <select
                  className='rounded border px-2 py-1 text-xs'
                  value={vehicle.direction}
                  onChange={(event) =>
                    updateVehicle(index, {
                      direction: event.target.value as 'inbound' | 'outbound'
                    })
                  }
                >
                  <option value='inbound'>Inbound</option>
                  <option value='outbound'>Outbound</option>
                </select>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  onClick={() => removeVehicle(index)}
                >
                  <Icons.close className='h-3 w-3' />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleCompute}
        disabled={computeMutation.isPending || !warehouseId || vehicles.length === 0}
      >
        {computeMutation.isPending ? 'Dang tinh...' : 'Tinh lich dock'}
      </Button>

      {result && result.assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Phan bo dock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='mb-4 flex flex-wrap gap-2 text-xs'>
              <Badge variant='secondary'>Cho trung binh {result.avgWaitMinutes} phut</Badge>
              <Badge variant='secondary'>Tong cua so {result.totalCompletionMinutes} phut</Badge>
              {Object.entries(result.utilizationByDock).map(([dockCode, utilization]) => (
                <Badge key={dockCode} variant='outline'>
                  {dockCode}: {utilization}%
                </Badge>
              ))}
            </div>
            {result.overloadWarnings.length > 0 && (
              <div className='mb-4 space-y-1 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900'>
                {result.overloadWarnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            )}
            <div className='space-y-2'>
              {result.docks.map((dock) => {
                const dockAssignments = result.assignments.filter(
                  (assignment) => assignment.dockId === dock.id
                );
                return (
                  <div key={dock.id} className='flex items-center gap-3'>
                    <span className='w-20 text-xs font-medium text-muted-foreground'>
                      {dock.code}
                    </span>
                    <div className='relative h-8 flex-1 rounded bg-muted'>
                      {dockAssignments.map((assignment, index) => {
                        const left =
                          ((timeToMinutes(assignment.startTime) - minTime) / range) * 100;
                        const width =
                          ((timeToMinutes(assignment.endTime) -
                            timeToMinutes(assignment.startTime)) /
                            range) *
                          100;
                        return (
                          <div
                            key={index}
                            title={`${assignment.vehiclePlate} ${assignment.startTime}-${assignment.endTime} | cho ${assignment.waitMinutes} phut`}
                            className={`absolute top-1 flex h-6 items-center justify-center overflow-hidden rounded text-xs font-medium text-white ${
                              assignment.direction === 'inbound' ? 'bg-blue-500' : 'bg-orange-500'
                            }`}
                            style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
                          >
                            {assignment.vehiclePlate}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
