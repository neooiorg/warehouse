import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createInboundReceipt,
  createOutboundShipment,
  createTransfer,
  importInventoryRows
} from './service';
import { inventoryKeys } from './queries';
import type {
  InboundReceiptPayload,
  InventoryImportKind,
  InventoryImportRow,
  OutboundShipmentPayload,
  TransferPayload
} from './types';

export const createInboundReceiptMutation = mutationOptions({
  mutationFn: (data: InboundReceiptPayload) => createInboundReceipt(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: inventoryKeys.all });
  }
});

export const createOutboundShipmentMutation = mutationOptions({
  mutationFn: (data: OutboundShipmentPayload) => createOutboundShipment(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: inventoryKeys.all });
  }
});

export const createTransferMutation = mutationOptions({
  mutationFn: (data: TransferPayload) => createTransfer(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: inventoryKeys.all });
  }
});

export const importInventoryRowsMutation = mutationOptions({
  mutationFn: (data: { kind: InventoryImportKind; rows: InventoryImportRow[] }) =>
    importInventoryRows(data.kind, data.rows),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: inventoryKeys.all });
  }
});
