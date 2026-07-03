'use client';

import { useForm } from '@tanstack/react-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useCreateLocation, useUpdateLocation } from '../api/mutations';
import { locationSchema, type LocationFormValues } from '../schemas/warehouse';
import type { Location, ZoneWithLocations } from '../api/types';

type Props = {
  warehouseId: string;
  zones: ZoneWithLocations[];
  location?: Location;
  children: React.ReactNode;
};

export default function LocationFormSheet({ warehouseId, zones, location, children }: Props) {
  const create = useCreateLocation(warehouseId);
  const update = useUpdateLocation(warehouseId);
  const form = useForm({
    validators: { onChange: locationSchema },
    defaultValues: {
      code: location?.code ?? '',
      type: (location?.type ?? 'rack') as 'rack' | 'floor',
      zoneId: location?.zoneId ?? undefined,
      level: location?.level ?? undefined,
      capacityVolume: location?.capacityVolume ?? undefined,
      capacityWeight: location?.capacityWeight ?? undefined,
      distanceToDock: location?.distanceToDock ?? undefined
    } as LocationFormValues,
    onSubmit: async ({ value }) => {
      if (location) await update.mutateAsync({ id: location.id, ...value });
      else await create.mutateAsync({ warehouseId, ...value });
      form.reset();
    }
  });

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className='overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>{location ? 'Chỉnh sửa vị trí' : 'Thêm vị trí'}</SheetTitle>
        </SheetHeader>
        <form
          className='mt-6 space-y-4'
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name='code'>
            {(field) => (
              <div className='space-y-1'>
                <Label>Mã vị trí *</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                  placeholder='A-01-01'
                />
              </div>
            )}
          </form.Field>

          <form.Field name='type'>
            {(field) => (
              <div className='space-y-1'>
                <Label>Loại *</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as 'rack' | 'floor')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='rack'>Kệ rack</SelectItem>
                    <SelectItem value='floor'>Sàn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name='zoneId'>
            {(field) => (
              <div className='space-y-1'>
                <Label>Khu vực</Label>
                <Select
                  value={field.state.value ?? ''}
                  onValueChange={(v) => field.handleChange(v || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn khu vực...' />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => (
                      <SelectItem key={z.id} value={z.id}>
                        {z.code} — {z.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <div className='grid grid-cols-2 gap-3'>
            <form.Field name='level'>
              {(field) => (
                <div className='space-y-1'>
                  <Label>Tầng</Label>
                  <Input
                    type='number'
                    value={field.state.value ?? ''}
                    onChange={(e) =>
                      field.handleChange(e.target.value ? +e.target.value : undefined)
                    }
                    placeholder='1'
                  />
                </div>
              )}
            </form.Field>
            <form.Field name='distanceToDock'>
              {(field) => (
                <div className='space-y-1'>
                  <Label>Khoảng cách dock (m)</Label>
                  <Input
                    type='number'
                    step='0.1'
                    value={field.state.value ?? ''}
                    onChange={(e) =>
                      field.handleChange(e.target.value ? +e.target.value : undefined)
                    }
                    placeholder='15'
                  />
                </div>
              )}
            </form.Field>
            <form.Field name='capacityWeight'>
              {(field) => (
                <div className='space-y-1'>
                  <Label>KL max (kg)</Label>
                  <Input
                    type='number'
                    value={field.state.value ?? ''}
                    onChange={(e) =>
                      field.handleChange(e.target.value ? +e.target.value : undefined)
                    }
                    placeholder='1000'
                  />
                </div>
              )}
            </form.Field>
            <form.Field name='capacityVolume'>
              {(field) => (
                <div className='space-y-1'>
                  <Label>Thể tích (m³)</Label>
                  <Input
                    type='number'
                    step='0.1'
                    value={field.state.value ?? ''}
                    onChange={(e) =>
                      field.handleChange(e.target.value ? +e.target.value : undefined)
                    }
                    placeholder='10'
                  />
                </div>
              )}
            </form.Field>
          </div>

          <Button type='submit' disabled={create.isPending || update.isPending} className='w-full'>
            {location ? 'Cập nhật' : 'Tạo vị trí'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
