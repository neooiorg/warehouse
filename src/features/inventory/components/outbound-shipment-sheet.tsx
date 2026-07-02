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
      toast.success('Outbound shipment recorded');
      onOpenChange(false);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message ?? 'Failed to record outbound shipment')
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
          <SheetTitle>Record Outbound Shipment</SheetTitle>
          <SheetDescription>
            Lots are picked automatically using each SKU's configured allocation rule
            (FIFO/FEFO/LEFO).
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='outbound-shipment-form' className='space-y-4'>
              <FormSelectField
                name='warehouseId'
                label='Warehouse'
                required
                options={warehouseOptions}
                placeholder='Select warehouse'
              />
              <FormSelectField
                name='skuId'
                label='SKU'
                required
                options={skuOptions}
                placeholder='Select SKU'
              />
              <FormTextField name='qty' label='Quantity' required type='number' min={0} step={1} />
              <FormSelectField
                name='performedBy'
                label='Shipped By (optional)'
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
          <Button type='submit' form='outbound-shipment-form' isLoading={createMutation.isPending}>
            <Icons.check /> Record Shipment
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
        <Icons.arrowRight className='mr-2 h-4 w-4' /> Outbound Shipment
      </Button>
      <OutboundShipmentSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
