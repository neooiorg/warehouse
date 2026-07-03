'use client';

import { useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { optimizeDockSchedule, type VehicleRequest } from '../utils/dock-optimizer';
import { createDockAppointment } from '../api/service';
import { productivityKeys } from '../api/queries';

type Props = {
  warehouseId: string;
  docks: { id: string; name: string }[];
  avgMinutesPerPallet?: number;
};

let vehicleCounter = 1;

export default function DockScheduler({ warehouseId, docks, avgMinutesPerPallet = 3 }: Props) {
  const qc = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [vehicles, setVehicles] = useState<VehicleRequest[]>([]);
  const [result, setResult] = useState<ReturnType<typeof optimizeDockSchedule> | null>(null);

  // New vehicle form
  const [palletCount, setPalletCount] = useState(20);
  const [arrivalTime, setArrivalTime] = useState(0);
  const [direction, setDirection] = useState<'inbound' | 'outbound'>('inbound');
  const [deadline, setDeadline] = useState<string>('');

  const handleAddVehicle = () => {
    const id = `V${vehicleCounter++}`;
    setVehicles((prev) => [
      ...prev,
      {
        id,
        palletCount,
        arrivalTime,
        direction,
        deadline: deadline ? +deadline : undefined
      }
    ]);
    toast.success(`Thêm xe ${id}`);
  };

  const handleOptimize = () => {
    const res = optimizeDockSchedule(
      vehicles,
      docks.map((d) => d.id),
      avgMinutesPerPallet
    );
    setResult(res);
    toast.success('Đã tối ưu lịch dock');
  };

  const handleSave = () => {
    if (!result) return;
    startTransition(async () => {
      for (const slot of result.schedule) {
        const vehicle = vehicles.find((v) => v.id === slot.vehicleRequestId);
        if (!vehicle) continue;
        await createDockAppointment({
          warehouseId,
          dockId: slot.dockId,
          direction: vehicle.direction,
          palletCount: vehicle.palletCount,
          scheduledStart: new Date(Date.now() + slot.startTime * 3600000),
          scheduledEnd: new Date(Date.now() + slot.endTime * 3600000)
        });
      }
      qc.invalidateQueries({ queryKey: productivityKeys.dockAppointments(warehouseId) });
      toast.success('Đã lưu lịch dock');
    });
  };

  const dockName = (id: string) => docks.find((d) => d.id === id)?.name ?? id.slice(0, 8);

  return (
    <div className='space-y-6'>
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Add vehicle */}
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>Thêm xe</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label className='text-xs'>Số pallet</Label>
                <Input
                  type='number'
                  min={1}
                  value={palletCount}
                  onChange={(e) => setPalletCount(+e.target.value)}
                  className='h-8'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-xs'>Giờ đến (h từ đầu ca)</Label>
                <Input
                  type='number'
                  min={0}
                  step={0.5}
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(+e.target.value)}
                  className='h-8'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-xs'>Hướng</Label>
                <Select value={direction} onValueChange={(v) => setDirection(v as any)}>
                  <SelectTrigger className='h-8'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='inbound'>Nhập kho</SelectItem>
                    <SelectItem value='outbound'>Xuất kho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label className='text-xs'>Hạn chót (giờ, tùy chọn)</Label>
                <Input
                  type='number'
                  min={0}
                  step={0.5}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder='8'
                  className='h-8'
                />
              </div>
            </div>
            <Button size='sm' onClick={handleAddVehicle}>
              Thêm xe
            </Button>
          </CardContent>
        </Card>

        {/* Vehicle list */}
        <Card>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm'>Danh sách xe ({vehicles.length})</CardTitle>
              <Button
                size='sm'
                onClick={handleOptimize}
                disabled={vehicles.length === 0 || docks.length === 0}
              >
                Tối ưu lịch
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='max-h-48 space-y-1 overflow-y-auto'>
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className='flex items-center justify-between rounded border px-2 py-1 text-sm'
                >
                  <span className='font-medium'>{v.id}</span>
                  <span className='text-muted-foreground'>{v.palletCount} pallet</span>
                  <span className='text-muted-foreground'>{v.arrivalTime}h</span>
                  <Badge
                    variant={v.direction === 'inbound' ? 'default' : 'secondary'}
                    className='text-xs'
                  >
                    {v.direction === 'inbound' ? 'Nhập' : 'Xuất'}
                  </Badge>
                  <button
                    className='text-xs text-destructive hover:underline'
                    onClick={() => setVehicles((prev) => prev.filter((x) => x.id !== v.id))}
                  >
                    Xóa
                  </button>
                </div>
              ))}
              {vehicles.length === 0 && (
                <p className='text-center text-sm text-muted-foreground py-4'>Chưa có xe nào</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization result */}
      {result && (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Kết quả tối ưu</CardTitle>
              <Button size='sm' onClick={handleSave} disabled={isPending}>
                Lưu vào lịch dock
              </Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex gap-4 text-sm'>
              <Badge variant='secondary'>Chờ TB: {(result.avgWaitTime * 60).toFixed(0)} phút</Badge>
              {Object.entries(result.utilization).map(([dockId, pct]) => (
                <Badge key={dockId} variant='outline'>
                  {dockName(dockId)}: {pct}%
                </Badge>
              ))}
            </div>

            {/* Timeline grid */}
            <div className='overflow-x-auto'>
              <div className='min-w-[600px] space-y-1'>
                {docks.map((dock) => {
                  const slots = result.schedule.filter((s) => s.dockId === dock.id);
                  const maxEnd = Math.max(...result.schedule.map((s) => s.endTime), 8);
                  return (
                    <div key={dock.id} className='flex items-center gap-2'>
                      <span className='w-20 shrink-0 text-xs font-medium'>{dock.name}</span>
                      <div className='relative h-8 flex-1 rounded bg-muted'>
                        {slots.map((s) => {
                          const vehicle = vehicles.find((v) => v.id === s.vehicleRequestId);
                          const left = `${(s.startTime / maxEnd) * 100}%`;
                          const width = `${((s.endTime - s.startTime) / maxEnd) * 100}%`;
                          return (
                            <div
                              key={s.vehicleRequestId}
                              className='absolute top-1 h-6 rounded text-xs text-white flex items-center justify-center'
                              style={{
                                left,
                                width,
                                backgroundColor:
                                  vehicle?.direction === 'inbound' ? '#6366f1' : '#10b981'
                              }}
                              title={`${s.vehicleRequestId} · ${s.startTime.toFixed(1)}h→${s.endTime.toFixed(1)}h`}
                            >
                              {s.vehicleRequestId}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
