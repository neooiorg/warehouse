'use client';

import { useState } from 'react';
import { useStore } from '@tanstack/react-form';
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
import { createInboundReceiptMutation } from '../api/mutations';
import { inboundReceiptSchema, type InboundReceiptFormValues } from '../schemas/inbound';
import {
  warehouseOptionsQuery,
  locationOptionsQuery,
  productSkuOptionsQuery,
  employeeOptionsQuery
} from '@/features/master-data/api/queries';

interface InboundReceiptSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InboundReceiptSheet({ open, onOpenChange }: InboundReceiptSheetProps) {
  const { data: warehouses = [] } = useQuery(warehouseOptionsQuery());
  const { data: skus = [] } = useQuery(productSkuOptionsQuery());
  const { data: employeesList = [] } = useQuery(employeeOptionsQuery());

  const createMutation = useMutation({
    ...createInboundReceiptMutation,
    onSuccess: () => {
      toast.success('Đã ghi nhận nhập kho');
      onOpenChange(false);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message ?? 'Không ghi nhận được nhập kho')
  });

  const form = useAppForm({
    defaultValues: {
      warehouseId: '',
      skuId: '',
      locationId: '',
      lotNo: '',
      qty: undefined as number | undefined,
      receivedDate: new Date().toISOString().slice(0, 10),
      expiryDate: '',
      performedBy: '',
      note: ''
    } as InboundReceiptFormValues,
    validators: { onSubmit: inboundReceiptSchema },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync({
        warehouseId: value.warehouseId,
        skuId: value.skuId,
        locationId: value.locationId,
        lotNo: value.lotNo,
        qty: value.qty,
        receivedDate: value.receivedDate,
        expiryDate: value.expiryDate || null,
        performedBy: value.performedBy || null,
        note: value.note || null
      });
    }
  });

  const selectedWarehouseId = useStore(form.store, (s) => s.values.warehouseId);
  const { data: locations = [] } = useQuery(locationOptionsQuery(selectedWarehouseId));

  const { FormTextField, FormSelectField } = useFormFields<InboundReceiptFormValues>();

  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }));
  const skuOptions = skus.map((s) => ({ value: s.id, label: `${s.sku} — ${s.name}` }));
  const locationOptions = locations.map((l) => ({ value: l.id, label: l.code }));
  const employeeOptions = employeesList.map((e) => ({ value: e.id, label: e.fullName }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Ghi nhận nhập kho</SheetTitle>
          <SheetDescription>Tạo lô mới từ phiếu hàng vừa nhận.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='inbound-receipt-form' className='space-y-4'>
              <FormSelectField
                name='warehouseId'
                label='Kho'
                required
                options={warehouseOptions}
                placeholder='Chọn kho'
                listeners={{
                  onChange: ({ fieldApi }) => {
                    fieldApi.form.setFieldValue('locationId', '');
                  }
                }}
              />
              <FormSelectField
                name='skuId'
                label='SKU'
                required
                options={skuOptions}
                placeholder='Chọn SKU'
              />
              <FormSelectField
                name='locationId'
                label='Vị trí'
                required
                options={locationOptions}
                placeholder={selectedWarehouseId ? 'Chọn vị trí' : 'Chọn kho trước'}
              />
              <FormTextField
                name='lotNo'
                label='Mã lô'
                required
                placeholder='Ví dụ: LOT-2026-0142'
              />
              <FormTextField name='qty' label='Số lượng' required type='number' min={0} step={1} />
              <FormTextField
                name='receivedDate'
                label='Ngày nhận'
                required
                placeholder='YYYY-MM-DD'
              />
              <FormTextField
                name='expiryDate'
                label='Hạn dùng (tùy chọn)'
                placeholder='YYYY-MM-DD'
              />
              <FormSelectField
                name='performedBy'
                label='Người nhận (tùy chọn)'
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
          <Button type='submit' form='inbound-receipt-form' isLoading={createMutation.isPending}>
            <Icons.check /> Ghi nhận nhập
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function InboundReceiptSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant='outline' onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> Nhập kho
      </Button>
      <InboundReceiptSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
