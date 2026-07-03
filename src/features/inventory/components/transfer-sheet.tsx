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
import { FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createTransferMutation } from '../api/mutations';
import { lotOptionsQuery } from '../api/queries';
import { transferSchema, type TransferFormValues } from '../schemas/transfer';
import {
  warehouseOptionsQuery,
  locationOptionsQuery,
  employeeOptionsQuery
} from '@/features/master-data/api/queries';

interface TransferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferSheet({ open, onOpenChange }: TransferSheetProps) {
  // Warehouse is a client-side filter for narrowing the lot/location
  // pickers below — it isn't submitted, the server derives the warehouse
  // from the selected lot — so it lives in local state rather than the form.
  const [warehouseId, setWarehouseId] = useState('');
  const { data: warehouses = [] } = useQuery(warehouseOptionsQuery());
  const { data: lots = [] } = useQuery(lotOptionsQuery(warehouseId));
  const { data: locations = [] } = useQuery(locationOptionsQuery(warehouseId));
  const { data: employeesList = [] } = useQuery(employeeOptionsQuery());

  const createMutation = useMutation({
    ...createTransferMutation,
    onSuccess: () => {
      toast.success('Đã ghi nhận chuyển vị trí');
      onOpenChange(false);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message ?? 'Không ghi nhận được chuyển vị trí')
  });

  const form = useAppForm({
    defaultValues: {
      lotId: '',
      toLocationId: '',
      qty: undefined as number | undefined,
      performedBy: '',
      note: ''
    } as TransferFormValues,
    validators: { onSubmit: transferSchema },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync({
        lotId: value.lotId,
        toLocationId: value.toLocationId,
        qty: value.qty,
        performedBy: value.performedBy || null,
        note: value.note || null
      });
    }
  });

  const selectedLotId = useStore(form.store, (s) => s.values.lotId);
  const selectedLot = lots.find((l) => l.id === selectedLotId);

  const { FormTextField, FormSelectField } = useFormFields<TransferFormValues>();

  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }));
  const lotOptions = lots.map((l) => ({
    value: l.id,
    label: `${l.lotNo} — ${l.sku} (${l.qty} tại ${l.locationCode ?? 'chưa có vị trí'})`
  }));
  const locationOptions = locations
    .filter((l) => l.id !== selectedLot?.id)
    .map((l) => ({ value: l.id, label: l.code }));
  const employeeOptions = employeesList.map((e) => ({ value: e.id, label: e.fullName }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Chuyển vị trí tồn kho</SheetTitle>
          <SheetDescription>
            Chuyển một phần hoặc toàn bộ lô sang vị trí khác trong cùng kho.
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <FieldLabel htmlFor='transfer-warehouse'>Kho</FieldLabel>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger id='transfer-warehouse'>
                  <SelectValue placeholder='Chọn kho' />
                </SelectTrigger>
                <SelectContent>
                  {warehouseOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <form.AppForm>
              <form.Form id='transfer-form' className='space-y-4'>
                <FormSelectField
                  name='lotId'
                  label='Lô'
                  required
                  options={lotOptions}
                  placeholder={warehouseId ? 'Chọn lô' : 'Chọn kho trước'}
                />
                <FormSelectField
                  name='toLocationId'
                  label='Vị trí đích'
                  required
                  options={locationOptions}
                  placeholder='Chọn vị trí đích'
                />
                <FormTextField
                  name='qty'
                  label={`Số lượng${selectedLot ? ` (tối đa ${selectedLot.qty})` : ''}`}
                  required
                  type='number'
                  min={0}
                  step={1}
                />
                <FormSelectField
                  name='performedBy'
                  label='Người chuyển (tùy chọn)'
                  options={employeeOptions}
                  placeholder='Chọn nhân viên'
                />
                <FormTextField name='note' label='Ghi chú (tùy chọn)' />
              </form.Form>
            </form.AppForm>
          </div>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type='submit' form='transfer-form' isLoading={createMutation.isPending}>
            <Icons.check /> Ghi nhận chuyển
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function TransferSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant='outline' onClick={() => setOpen(true)}>
        <Icons.transfer className='mr-2 h-4 w-4' /> Chuyển vị trí
      </Button>
      <TransferSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
