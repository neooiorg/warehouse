import { queryOptions } from '@tanstack/react-query';
import { getLots, getTransactions, getLotOptions } from './service';
import type { LotFilters, TransactionFilters } from './types';

export type { LotWithDetails, TransactionWithDetails } from './types';

export const inventoryKeys = {
  all: ['inventory'] as const,
  lots: (filters: LotFilters) => [...inventoryKeys.all, 'lots', filters] as const,
  lotOptions: (warehouseId: string) => [...inventoryKeys.all, 'lot-options', warehouseId] as const,
  transactions: (filters: TransactionFilters) =>
    [...inventoryKeys.all, 'transactions', filters] as const
};

export const lotOptionsQuery = (warehouseId: string) =>
  queryOptions({
    queryKey: inventoryKeys.lotOptions(warehouseId),
    queryFn: () => getLotOptions(warehouseId),
    enabled: !!warehouseId
  });

export const lotsQueryOptions = (filters: LotFilters) =>
  queryOptions({
    queryKey: inventoryKeys.lots(filters),
    queryFn: () => getLots(filters)
  });

export const transactionsQueryOptions = (filters: TransactionFilters) =>
  queryOptions({
    queryKey: inventoryKeys.transactions(filters),
    queryFn: () => getTransactions(filters)
  });
