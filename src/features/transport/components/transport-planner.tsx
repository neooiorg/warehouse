'use client';

import { useState, useTransition } from 'react';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { deliveryOrdersOptions, transportKeys } from '../api/queries';
import { createDeliveryOrder, updateDeliveryOrderStatus, planRoute } from '../api/service';
import type { RouteResult } from '../utils/route-optimizer';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ lập lịch',
  planned: 'Đã lập lịch',
  dispatched: 'Đang giao',
  delivered: 'Hoàn thành'
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'secondary',
  planned: 'default',
  dispatched: 'outline',
  delivered: 'secondary'
};

export default function TransportPlanner() {
  const qc = useQueryClient();
  const { data: orders } = useSuspenseQuery(deliveryOrdersOptions());
  const [isPending, startTransition] = useTransition();
  const [routeResult, setRouteResult] = useState<(RouteResult & { orderId: string }) | null>(null);

  const [destination, setDestination] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const handleCreate = () => {
    if (!destination) return;
    startTransition(async () => {
      await createDeliveryOrder({
        destination,
        destinationLat: lat ? +lat : null,
        destinationLng: lng ? +lng : null
      });
      qc.invalidateQueries({ queryKey: transportKeys.orders() });
      setDestination('');
      setLat('');
      setLng('');
      toast.success('Tạo đơn vận chuyển thành công');
    });
  };

  const handlePlanRoute = (orderId: string) => {
    startTransition(async () => {
      try {
        const result = await planRoute(orderId);
        qc.invalidateQueries({ queryKey: transportKeys.orders() });
        setRouteResult({ ...result, orderId });
        toast.success('Đã lập tuyến đường');
      } catch (e) {
        toast.error('Lỗi lập tuyến: ' + (e instanceof Error ? e.message : 'Không rõ lỗi'));
      }
    });
  };

  return (
    <div className='space-y-6'>
      {/* New order */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm'>Tạo đơn giao hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-4'>
            <div className='col-span-2 space-y-1'>
              <Label className='text-xs'>Địa chỉ giao</Label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder='123 Đường ABC, TP.HCM'
                className='h-8'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Vĩ độ (lat)</Label>
              <Input
                type='number'
                step='0.0001'
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder='10.7769'
                className='h-8'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Kinh độ (lng)</Label>
              <Input
                type='number'
                step='0.0001'
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder='106.7009'
                className='h-8'
              />
            </div>
          </div>
          <Button
            size='sm'
            className='mt-3'
            onClick={handleCreate}
            disabled={isPending || !destination}
          >
            <Icons.add className='mr-1 h-3 w-3' /> Tạo đơn
          </Button>
        </CardContent>
      </Card>

      {/* Order list */}
      <div className='space-y-2'>
        {orders.length === 0 && (
          <div className='rounded-lg border p-12 text-center text-sm text-muted-foreground'>
            Chưa có đơn vận chuyển nào
          </div>
        )}
        {orders.map((order) => (
          <div
            key={order.id}
            className='flex items-center justify-between rounded-md border px-4 py-3'
          >
            <div className='flex-1'>
              <div className='font-medium text-sm'>{order.destination}</div>
              <div className='text-xs text-muted-foreground'>
                {order.destinationLat
                  ? `${order.destinationLat}, ${order.destinationLng}`
                  : 'Chưa có tọa độ'}{' '}
                · {order.preferredDate ?? 'Không có ngày'}
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant={STATUS_VARIANTS[order.status]}>{STATUS_LABELS[order.status]}</Badge>
              {order.status === 'pending' && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handlePlanRoute(order.id)}
                  disabled={isPending}
                >
                  <Icons.trendingUp className='mr-1 h-3 w-3' /> Lập lịch
                </Button>
              )}
              {order.status === 'planned' && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    startTransition(() =>
                      updateDeliveryOrderStatus(order.id, 'dispatched').then(() =>
                        qc.invalidateQueries({ queryKey: transportKeys.orders() })
                      )
                    );
                  }}
                  disabled={isPending}
                >
                  Xuất phát
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Route result */}
      {routeResult && (
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Tuyến đường tối ưu</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex gap-3 text-sm'>
              <Badge variant='secondary'>{routeResult.totalDistanceKm} km</Badge>
              <Badge variant='secondary'>{routeResult.estimatedHours}h dự kiến</Badge>
              {routeResult.fuelCostVnd && (
                <Badge variant='outline'>
                  ~{routeResult.fuelCostVnd.toLocaleString('vi-VN')}đ xăng
                </Badge>
              )}
            </div>

            <div className='space-y-1'>
              {routeResult.stops.map((stop, i) => (
                <div key={stop.warehouseId} className='flex items-center gap-3 text-sm'>
                  <span className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0'>
                    {i + 1}
                  </span>
                  <span className='font-medium'>{stop.warehouseName}</span>
                  {i > 0 && (
                    <span className='text-xs text-muted-foreground'>
                      +{stop.distanceFromPreviousKm} km
                    </span>
                  )}
                </div>
              ))}
              <div className='flex items-center gap-3 text-sm mt-1'>
                <span className='flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold shrink-0'>
                  D
                </span>
                <span className='font-medium text-green-600'>Điểm giao hàng</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
