'use client';

import { useState } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createOutboundShipmentMutation } from '../api/mutations';
import { outboundShipmentSchema, type OutboundShipmentFormValues } from '../schemas/outbound';
import {
  warehouseOptionsQuery,
  productSkuOptionsQuery,
  employeeOptionsQuery
} from '@/features/master-data/api/queries';

interface OutboundShipmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OutboundShipmentSheet({ open, onOpenChange }: OutboundShipmentSheetProps) {
  const { data: warehouses = [] } = useQuery(warehouseOptionsQuery());
  const { data: skus = [] } = useQuery(productSkuOptionsQuery());
  const { data: employeesList = [] } = useQuery(employeeOptionsQuery());

  const createMutation = useMutation({
    ...createOutboundShipmentMutation,
    onSuccess: () => {
      toast.success('Đã ghi nhận xuất kho');
      onOpenChange(false);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message ?? 'Không ghi nhận được xuất kho')
  });

  const form = useAppForm({
    defaultValues: {
      warehouseId: '',
      skuId: '',
      qty: undefined as number | undefined,
      performedBy: '',
      note: ''
    } as OutboundShipmentFormValues,
    validators: { onSubmit: outboundShipmentSchema },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync({
        warehouseId: value.warehouseId,
        skuId: value.skuId,
        qty: value.qty,
        performedBy: value.performedBy || null,
        note: value.note || null
      });
    }
  });

  const { FormTextField, FormSelectField } = useFormFields<OutboundShipmentFormValues>();

  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }));
  const skuOptions = skus.map((s) => ({ value: s.id, label: `${s.sku} — ${s.name}` }));
  const employeeOptions = employeesList.map((e) => ({ value: e.id, label: e.fullName }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Ghi nhận xuất kho</SheetTitle>
          <SheetDescription>
            Hệ thống tự chọn lô theo quy tắc của từng SKU: FIFO, FEFO hoặc LEFO.
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='outbound-shipment-form' className='space-y-4'>
              <FormSelectField
                name='warehouseId'
                label='Kho'
                required
                options={warehouseOptions}
                placeholder='Chọn kho'
              />
              <FormSelectField
                name='skuId'
                label='SKU'
                required
                options={skuOptions}
                placeholder='Chọn SKU'
              />
              <FormTextField name='qty' label='Số lượng' required type='number' min={0} step={1} />
              <FormSelectField
                name='performedBy'
                label='Người xuất (tùy chọn)'
                options={employeeOptions}
                placeholder='Chọn nhân viên'
              />
              <FormTextField name='note' label='Ghi chú (tùy chọn)' />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type='submit' form='outbound-shipment-form' isLoading={createMutation.isPending}>
            <Icons.check /> Ghi nhận xuất
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function OutboundShipmentSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant='outline' onClick={() => setOpen(true)}>
        <Icons.arrowRight className='mr-2 h-4 w-4' /> Xuất kho
      </Button>
      <OutboundShipmentSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
