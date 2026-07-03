'use client';

import { useForm } from '@tanstack/react-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCreateWarehouse, useUpdateWarehouse } from '../api/mutations';
import { warehouseSchema, type WarehouseFormValues } from '../schemas/warehouse';
import type { WarehouseWithCounts } from '../api/types';

type Props = {
  warehouse?: WarehouseWithCounts;
  children: React.ReactNode;
};

export default function WarehouseFormSheet({ warehouse, children }: Props) {
  const create = useCreateWarehouse();
  const update = useUpdateWarehouse();
  const isPending = create.isPending || update.isPending;

  const form = useForm({
    validators: { onChange: warehouseSchema },
    defaultValues: {
      name: warehouse?.name ?? '',
      code: warehouse?.code ?? '',
      address: warehouse?.address ?? '',
      lat: warehouse?.lat ?? undefined,
      lng: warehouse?.lng ?? undefined
    } as WarehouseFormValues,
    onSubmit: async ({ value }) => {
      if (warehouse) {
        await update.mutateAsync({ id: warehouse.id, ...value });
      } else {
        await create.mutateAsync(value);
      }
      form.reset();
    }
  });

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{warehouse ? 'Chỉnh sửa kho' : 'Thêm kho mới'}</SheetTitle>
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
                <Label>Tên kho *</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='Kho Hà Nội'
                />
                {field.state.meta.errors[0]?.message && (
                  <p className='text-destructive text-sm'>{field.state.meta.errors[0].message}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name='code'>
            {(field) => (
              <div className='space-y-1'>
                <Label>Mã kho *</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                  placeholder='HN01'
                />
                {field.state.meta.errors[0]?.message && (
                  <p className='text-destructive text-sm'>{field.state.meta.errors[0].message}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name='address'>
            {(field) => (
              <div className='space-y-1'>
                <Label>Địa chỉ</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='123 Đường ABC, Quận 1...'
                />
              </div>
            )}
          </form.Field>

          <div className='grid grid-cols-2 gap-3'>
            <form.Field name='lat'>
              {(field) => (
                <div className='space-y-1'>
                  <Label>Vĩ độ (lat)</Label>
                  <Input
                    type='number'
                    step='any'
                    value={field.state.value ?? ''}
                    onChange={(e) =>
                      field.handleChange(e.target.value ? +e.target.value : undefined)
                    }
                    placeholder='21.028'
                  />
                </div>
              )}
            </form.Field>
            <form.Field name='lng'>
              {(field) => (
                <div className='space-y-1'>
                  <Label>Kinh độ (lng)</Label>
                  <Input
                    type='number'
                    step='any'
                    value={field.state.value ?? ''}
                    onChange={(e) =>
                      field.handleChange(e.target.value ? +e.target.value : undefined)
                    }
                    placeholder='105.854'
                  />
                </div>
              )}
            </form.Field>
          </div>

          <Button type='submit' disabled={isPending} className='w-full'>
            {isPending ? 'Đang lưu...' : warehouse ? 'Cập nhật' : 'Tạo kho'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
