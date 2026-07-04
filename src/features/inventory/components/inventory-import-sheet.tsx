'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { importInventoryRowsMutation } from '../api/mutations';
import type { InventoryImportKind, InventoryImportRow } from '../api/types';

const schemas: Record<InventoryImportKind, string> = {
  inbound: 'warehouseCode,sku,lotNo,locationCode,qty,receivedDate,expiryDate,performedByName,note',
  outbound: 'warehouseCode,sku,qty,performedByName,note',
  transfer: 'warehouseCode,sku,lotNo,toLocationCode,qty,performedByName,note'
};

export function InventoryImportSheet() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<InventoryImportKind>('inbound');
  const importMutation = useMutation(importInventoryRowsMutation);

  function handleFile(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const rows: InventoryImportRow[] = result.data.map((row, index) => ({
          line: index + 2,
          warehouseCode: row.warehouseCode ?? '',
          sku: row.sku ?? '',
          qty: Number(row.qty ?? 0),
          note: row.note ?? '',
          lotNo: row.lotNo ?? '',
          locationCode: row.locationCode ?? '',
          toLocationCode: row.toLocationCode ?? '',
          receivedDate: row.receivedDate ?? '',
          expiryDate: row.expiryDate ?? '',
          performedByName: row.performedByName ?? ''
        }));
        const imported = await importMutation.mutateAsync({ kind, rows });
        if (imported.errors.length > 0) {
          toast.error(
            imported.errors.map((error) => `Dong ${error.line}: ${error.message}`).join(' | ')
          );
          return;
        }
        toast.success(`Da nhap ${imported.importedCount} dong ${kind}.`);
        setOpen(false);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='outline'>
          <Icons.upload className='mr-2 h-4 w-4' />
          Nhap CSV
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Nhap giao dich ton kho</SheetTitle>
        </SheetHeader>
        <div className='mt-4 space-y-4'>
          <div className='space-y-2'>
            <label htmlFor='inventory-import-kind' className='text-sm font-medium'>
              Loai file
            </label>
            <select
              id='inventory-import-kind'
              className='w-full rounded-md border px-3 py-2 text-sm'
              value={kind}
              onChange={(event) => setKind(event.target.value as InventoryImportKind)}
            >
              <option value='inbound'>Inbound</option>
              <option value='outbound'>Outbound</option>
              <option value='transfer'>Transfer</option>
            </select>
          </div>
          <div className='rounded-md border border-dashed p-3 text-sm'>
            <div className='mb-1 font-medium'>Schema bat buoc</div>
            <div className='text-muted-foreground text-xs'>{schemas[kind]}</div>
          </div>
          <input
            type='file'
            accept='.csv'
            aria-label='Chon file CSV ton kho'
            onChange={(event) => event.target.files?.[0] && handleFile(event.target.files[0])}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
