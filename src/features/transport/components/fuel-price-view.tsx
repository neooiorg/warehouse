'use client';

import { useState, useTransition } from 'react';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { fuelPricesOptions, transportKeys } from '../api/queries';
import { upsertFuelPrice } from '../api/service';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const FUEL_LABELS: Record<string, string> = {
  ron95: 'RON 95',
  ron92: 'RON 92',
  diesel: 'Diesel',
  e5: 'E5'
};

const FUEL_COLORS: Record<string, string> = {
  ron95: '#6366f1',
  ron92: '#10b981',
  diesel: '#f59e0b',
  e5: '#ef4444'
};

export default function FuelPriceView() {
  const qc = useQueryClient();
  const { data: prices } = useSuspenseQuery(fuelPricesOptions());
  const [isPending, startTransition] = useTransition();

  const [fuelType, setFuelType] = useState<'ron95' | 'ron92' | 'diesel' | 'e5'>('ron95');
  const [priceValue, setPriceValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleAdd = () => {
    if (!priceValue) return;
    startTransition(async () => {
      await upsertFuelPrice({ fuelType, pricePerLiter: +priceValue, effectiveDate: date });
      qc.invalidateQueries({ queryKey: transportKeys.fuelPrices() });
      setPriceValue('');
      toast.success('Đã lưu giá xăng');
    });
  };

  // Get latest prices per fuel type
  const latest = ['ron95', 'ron92', 'diesel', 'e5'].map((ft) => {
    const entry = prices.find((p) => p.fuelType === ft);
    return {
      fuelType: ft,
      price: entry ? Number(entry.pricePerLiter) : null,
      date: entry?.effectiveDate
    };
  });

  // Build chart data: group by date, one entry per date with all fuel types
  const dateMap: Record<string, Record<string, number>> = {};
  for (const p of prices) {
    if (!dateMap[p.effectiveDate]) dateMap[p.effectiveDate] = {};
    dateMap[p.effectiveDate][p.fuelType] = Number(p.pricePerLiter);
  }
  const chartData = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, vals]) => ({ date, ...vals }));

  return (
    <div className='space-y-6'>
      {/* Latest prices */}
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        {latest.map(({ fuelType: ft, price, date }) => (
          <Card key={ft}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-normal text-muted-foreground'>
                {FUEL_LABELS[ft]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {price ? (
                <>
                  <p className='text-2xl font-bold'>{price.toLocaleString('vi-VN')}đ</p>
                  <p className='text-xs text-muted-foreground'>/{date}</p>
                </>
              ) : (
                <p className='text-muted-foreground text-sm'>Chưa có dữ liệu</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Biến động giá 30 ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <XAxis dataKey='date' tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString('vi-VN')}đ`} />
                <Legend />
                {Object.entries(FUEL_COLORS).map(([ft, color]) => (
                  <Line
                    key={ft}
                    type='monotone'
                    dataKey={ft}
                    name={FUEL_LABELS[ft]}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Manual input */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm'>Cập nhật thủ công</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-end gap-3'>
            <div className='space-y-1'>
              <Label className='text-xs'>Loại xăng</Label>
              <Select value={fuelType} onValueChange={(v) => setFuelType(v as any)}>
                <SelectTrigger className='h-8 w-32'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FUEL_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Giá (VND/lít)</Label>
              <Input
                type='number'
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                className='h-8 w-36'
                placeholder='25000'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Ngày hiệu lực</Label>
              <Input
                type='date'
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className='h-8 w-40'
              />
            </div>
            <Button size='sm' onClick={handleAdd} disabled={isPending || !priceValue}>
              Lưu
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Price history table */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm'>Lịch sử giá</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='max-h-64 space-y-1 overflow-y-auto'>
            {prices.slice(0, 50).map((p) => (
              <div
                key={p.id}
                className='flex items-center justify-between rounded border px-3 py-1.5 text-sm'
              >
                <Badge
                  style={{ backgroundColor: FUEL_COLORS[p.fuelType] }}
                  className='text-white border-0 text-xs'
                >
                  {FUEL_LABELS[p.fuelType]}
                </Badge>
                <span className='font-medium'>
                  {Number(p.pricePerLiter).toLocaleString('vi-VN')}đ/L
                </span>
                <span className='text-muted-foreground'>{p.effectiveDate}</span>
                <span className='text-xs text-muted-foreground'>{p.source ?? 'manual'}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
