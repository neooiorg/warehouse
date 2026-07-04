import type { inventoryLots, inventoryTransactions } from '@/db/schema';

export type InventoryLot = typeof inventoryLots.$inferSelect;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;

export type LotWithDetails = InventoryLot & {
  sku: string;
  skuName: string;
  warehouseCode: string;
  locationCode: string | null;
};

export type TransactionWithDetails = InventoryTransaction & {
  sku: string;
  skuName: string;
  warehouseCode: string;
  fromLocationCode: string | null;
  toLocationCode: string | null;
  performedByName: string | null;
};

export type LotFilters = {
  warehouseId?: string;
  skuId?: string;
  status?: InventoryLot['status'];
  /** Matches against lot number or SKU code, case-insensitive. */
  search?: string;
  page?: number;
  limit?: number;
};

export type TransactionFilters = {
  warehouseId?: string;
  lotId?: string;
  locationId?: string;
  page?: number;
  limit?: number;
  /** Chronological order for chain-of-custody views; defaults to newest first. */
  order?: 'asc' | 'desc';
};

export type InboundReceiptPayload = {
  warehouseId: string;
  skuId: string;
  locationId: string;
  lotNo: string;
  qty: number;
  receivedDate: string;
  expiryDate?: string | null;
  performedBy?: string | null;
  note?: string | null;
};

export type OutboundShipmentPayload = {
  warehouseId: string;
  skuId: string;
  qty: number;
  performedBy?: string | null;
  note?: string | null;
};

export type TransferPayload = {
  lotId: string;
  toLocationId: string;
  qty: number;
  performedBy?: string | null;
  note?: string | null;
};

export type InventoryImportKind = 'inbound' | 'outbound' | 'transfer';

export type InventoryImportRow = {
  line: number;
  warehouseCode: string;
  sku: string;
  qty: number;
  note?: string | null;
  lotNo?: string;
  locationCode?: string;
  toLocationCode?: string;
  receivedDate?: string;
  expiryDate?: string | null;
  performedByName?: string | null;
};

export type InventoryImportResult = {
  importedCount: number;
  errors: Array<{ line: number; message: string }>;
};

export type LotOption = {
  id: string;
  lotNo: string;
  sku: string;
  qty: number;
  locationCode: string | null;
  warehouseId: string;
};
