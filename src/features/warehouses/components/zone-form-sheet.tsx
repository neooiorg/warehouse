'use client';

import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCreateZone, useUpdateZone } from '../api/mutations';
import { zoneSchema } from '../schemas/warehouse';
import type { ZoneWithLocations } from '../api/types';

type Props = { warehouseId: string; zone?: ZoneWithLocations; children: React.ReactNode };

export default function ZoneFormSheet({ warehouseId, zone, children }: Props) {
  const create = useCreateZone(warehouseId);
  const update = useUpdateZone(warehouseId);
  const form = useForm({
    validatorAdapter: zodValidator(),
    validators: { onChange: zoneSchema },
    defaultValues: { name: zone?.name ?? '', code: zone?.code ?? '' },
    onSubmit: async ({ value }) => {
      if (zone) await update.mutateAsync({ id: zone.id, ...value });
      else await create.mutateAsync({ warehouseId, ...value });
      form.reset();
    }
  });

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{zone ? 'Chỉnh sửa khu vực' : 'Thêm khu vực'}</SheetTitle>
        </SheetHeader>
        <form
          className='mt-6 space-y-4'
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name='name'>
            {(field) => (
              <div className='space-y-1'>
                <Label>Tên khu vực *</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='Khu A'
                />
              </div>
            )}
          </form.Field>
          <form.Field name='code'>
            {(field) => (
              <div className='space-y-1'>
                <Label>Mã khu vực *</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                  placeholder='A'
                />
              </div>
            )}
          </form.Field>
          <Button type='submit' disabled={create.isPending || update.isPending} className='w-full'>
            {zone ? 'Cập nhật' : 'Tạo khu vực'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
