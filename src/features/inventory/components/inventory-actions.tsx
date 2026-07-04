'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { InboundReceiptSheetTrigger } from './inbound-receipt-sheet';
import { InventoryImportSheet } from './inventory-import-sheet';
import { OutboundShipmentSheetTrigger } from './outbound-shipment-sheet';
import { TransferSheetTrigger } from './transfer-sheet';

export function InventoryActions() {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Link
        href='/dashboard/inventory/traceability'
        className={buttonVariants({ variant: 'ghost' })}
      >
        <Icons.search className='mr-2 h-4 w-4' />
        Truy xuat
      </Link>
      <InventoryImportSheet />
      <InboundReceiptSheetTrigger />
      <OutboundShipmentSheetTrigger />
      <TransferSheetTrigger />
    </div>
  );
}
