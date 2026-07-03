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
import { useCreateDock, useUpdateDock } from '../api/mutations';
import { dockSchema, type DockFormValues } from '../schemas/warehouse';
import type { Dock } from '../api/types';

type Props = { warehouseId: string; dock?: Dock; children: React.ReactNode };

export default function DockFormSheet({ warehouseId, dock, children }: Props) {
  const create = useCreateDock(warehouseId);
  const update = useUpdateDock(warehouseId);
  const form = useForm({
    validators: { onChange: dockSchema },
    defaultValues: {
      code: dock?.code ?? '',
      direction: (dock?.direction ?? 'both') as 'inbound' | 'outbound' | 'both'
    } as DockFormValues,
    onSubmit: async ({ value }) => {
      if (dock) await update.mutateAsync({ id: dock.id, ...value });
      else await create.mutateAsync({ warehouseId, ...value });
      form.reset();
    }
  });

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{dock ? 'Chỉnh sửa cửa dock' : 'Thêm cửa dock'}</SheetTitle>
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
                <Label>Mã cửa *</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                  placeholder='D01'
                />
              </div>
            )}
          </form.Field>
          <form.Field name='direction'>
            {(field) => (
              <div className='space-y-1'>
                <Label>Chiều hoạt động *</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as 'inbound' | 'outbound' | 'both')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='both'>Hai chiều</SelectItem>
                    <SelectItem value='inbound'>Nhập hàng</SelectItem>
                    <SelectItem value='outbound'>Xuất hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>
          <Button type='submit' disabled={create.isPending || update.isPending} className='w-full'>
            {dock ? 'Cập nhật' : 'Tạo cửa dock'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
