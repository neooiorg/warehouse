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
      toast.success('Inbound receipt recorded');
      onOpenChange(false);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message ?? 'Failed to record inbound receipt')
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
          <SheetTitle>Record Inbound Receipt</SheetTitle>
          <SheetDescription>Create a new lot from a received shipment.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='inbound-receipt-form' className='space-y-4'>
              <FormSelectField
                name='warehouseId'
                label='Warehouse'
                required
                options={warehouseOptions}
                placeholder='Select warehouse'
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
                placeholder='Select SKU'
              />
              <FormSelectField
                name='locationId'
                label='Location'
                required
                options={locationOptions}
                placeholder={selectedWarehouseId ? 'Select location' : 'Select a warehouse first'}
              />
              <FormTextField
                name='lotNo'
                label='Lot Number'
                required
                placeholder='e.g. LOT-2026-0142'
              />
              <FormTextField name='qty' label='Quantity' required type='number' min={0} step={1} />
              <FormTextField
                name='receivedDate'
                label='Received Date'
                required
                placeholder='YYYY-MM-DD'
              />
              <FormTextField
                name='expiryDate'
                label='Expiry Date (optional)'
                placeholder='YYYY-MM-DD'
              />
              <FormSelectField
                name='performedBy'
                label='Received By (optional)'
                options={employeeOptions}
                placeholder='Select employee'
              />
              <FormTextField name='note' label='Note (optional)' />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='inbound-receipt-form' isLoading={createMutation.isPending}>
            <Icons.check /> Record Receipt
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
        <Icons.add className='mr-2 h-4 w-4' /> Inbound Receipt
      </Button>
      <InboundReceiptSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
