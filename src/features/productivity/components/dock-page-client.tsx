'use client';

import { useState, useRef } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { computeDockScheduleMutation } from '../api/mutations';
import { warehouseOptionsQuery } from '@/features/master-data/api/queries';
import type { VehicleSlot, DockAssignment } from '../api/types';
import Papa from 'papaparse';

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function DockPageClient() {
  const { data: warehouses } = useSuspenseQuery(warehouseOptionsQuery());
  const computeMut = useMutation(computeDockScheduleMutation);

  const [warehouseId, setWarehouseId] = useState('');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [forkliftsCount, setForkliftsCount] = useState(2);
  const [minutesPerPallet, setMinutesPerPallet] = useState(5);
  const [vehicles, setVehicles] = useState<VehicleSlot[]>([]);
  const [result, setResult] = useState<{
    assignments: DockAssignment[];
    docks: { id: string; code: string }[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function addVehicle() {
    setVehicles((v) => [
      ...v,
      { plateNumber: '', arrivalTime: '08:00', palletCount: 10, direction: 'inbound' }
    ]);
  }

  function updateVehicle(i: number, patch: Partial<VehicleSlot>) {
    setVehicles((v) => v.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  function removeVehicle(i: number) {
    setVehicles((v) => v.filter((_, idx) => idx !== i));
  }

  function handleCSV(file: File) {
    Papa.parse<string[]>(file, {
      complete: (res) => {
        const rows = res.data.slice(1).filter((r) => r[0]);
        setVehicles(
          rows.map((r) => ({
            plateNumber: r[0] ?? '',
            arrivalTime: r[1] ?? '08:00',
            palletCount: Number(r[2] ?? 10),
            direction: (r[3] as 'inbound' | 'outbound') ?? 'inbound'
          }))
        );
      }
    });
  }

  async function handleCompute() {
    const res = await computeMut.mutateAsync({
      warehouseId,
      scheduleDate,
      forkliftsCount,
      minutesPerPallet,
      vehicles
    });
    setResult({ assignments: res.assignments, docks: res.docks });
  }

  // Simple Gantt visualization using divs
  const allTimes =
    result?.assignments.flatMap((a) => [timeToMinutes(a.startTime), timeToMinutes(a.endTime)]) ??
    [];
  const minTime = allTimes.length ? Math.min(...allTimes) : 480;
  const maxTime = allTimes.length ? Math.max(...allTimes) : 1080;
  const range = maxTime - minTime || 60;

  return (
    <div className='space-y-6'>
      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm'>Thông số lịch dock</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-4'>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Kho</label>
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
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Ngày</label>
            <input
              type='date'
              className='rounded-md border px-3 py-2 text-sm'
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Số xe nâng</label>
            <input
              type='number'
              min={1}
              className='w-20 rounded-md border px-3 py-2 text-sm'
              value={forkliftsCount}
              onChange={(e) => setForkliftsCount(Number(e.target.value))}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Phút/pallet</label>
            <input
              type='number'
              min={1}
              step={0.5}
              className='w-24 rounded-md border px-3 py-2 text-sm'
              value={minutesPerPallet}
              onChange={(e) => setMinutesPerPallet(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicles */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='text-sm'>Danh sách xe ({vehicles.length})</CardTitle>
          <div className='flex gap-2'>
            <input
              ref={fileRef}
              type='file'
              accept='.csv'
              className='hidden'
              onChange={(e) => e.target.files?.[0] && handleCSV(e.target.files[0])}
            />
            <Button variant='outline' size='sm' onClick={() => fileRef.current?.click()}>
              <Icons.upload className='mr-1 h-4 w-4' />
              Nhập CSV
            </Button>
            <Button size='sm' onClick={addVehicle}>
              <Icons.add className='mr-1 h-4 w-4' />
              Thêm xe
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              Nhập CSV hoặc thêm xe thủ công. Cột: Biển số, Giờ đến (HH:MM), Số pallet, Chiều
              (nhập/xuất)
            </p>
          )}
          <div className='space-y-2'>
            {vehicles.map((v, i) => (
              <div
                key={i}
                className='flex flex-wrap items-center gap-2 rounded-md border px-3 py-2'
              >
                <input
                  placeholder='Biển số'
                  className='w-28 rounded border px-2 py-1 text-xs'
                  value={v.plateNumber}
                  onChange={(e) => updateVehicle(i, { plateNumber: e.target.value })}
                />
                <input
                  type='time'
                  className='rounded border px-2 py-1 text-xs'
                  value={v.arrivalTime}
                  onChange={(e) => updateVehicle(i, { arrivalTime: e.target.value })}
                />
                <input
                  type='number'
                  min={1}
                  placeholder='Pallet'
                  className='w-16 rounded border px-2 py-1 text-xs'
                  value={v.palletCount}
                  onChange={(e) => updateVehicle(i, { palletCount: Number(e.target.value) })}
                />
                <select
                  className='rounded border px-2 py-1 text-xs'
                  value={v.direction}
                  onChange={(e) =>
                    updateVehicle(i, { direction: e.target.value as 'inbound' | 'outbound' })
                  }
                >
                  <option value='inbound'>Nhập</option>
                  <option value='outbound'>Xuất</option>
                </select>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  onClick={() => removeVehicle(i)}
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
        disabled={computeMut.isPending || !warehouseId || vehicles.length === 0}
      >
        {computeMut.isPending ? 'Đang tính...' : 'Tính lịch dock'}
      </Button>

      {/* Gantt result */}
      {result && result.assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Sơ đồ phân bổ cửa dock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {result.docks.map((dock) => {
                const dockAssignments = result.assignments.filter((a) => a.dockId === dock.id);
                return (
                  <div key={dock.id} className='flex items-center gap-3'>
                    <span className='w-20 text-xs font-medium text-muted-foreground'>
                      {dock.code}
                    </span>
                    <div className='relative h-8 flex-1 rounded bg-muted'>
                      {dockAssignments.map((a, i) => {
                        const left = ((timeToMinutes(a.startTime) - minTime) / range) * 100;
                        const width =
                          ((timeToMinutes(a.endTime) - timeToMinutes(a.startTime)) / range) * 100;
                        return (
                          <div
                            key={i}
                            title={`${a.vehiclePlate} ${a.startTime}–${a.endTime} (${a.palletCount} pallet)`}
                            className={`absolute top-1 h-6 rounded text-xs font-medium text-white flex items-center justify-center overflow-hidden ${a.direction === 'inbound' ? 'bg-blue-500' : 'bg-orange-500'}`}
                            style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
                          >
                            {a.vehiclePlate}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className='mt-2 flex gap-3 text-xs text-muted-foreground'>
                <span className='flex items-center gap-1'>
                  <span className='inline-block h-3 w-3 rounded bg-blue-500' /> Nhập
                </span>
                <span className='flex items-center gap-1'>
                  <span className='inline-block h-3 w-3 rounded bg-orange-500' /> Xuất
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
