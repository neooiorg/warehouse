// Pure allocation engine — no DB access, so it stays unit-testable
// independent of Drizzle/Neon. service.ts loads candidate lots and calls
// this to decide which lots (and how much of each) to pick for an outbound
// request.
//
// The sort rule is never hardcoded to "FIFO" or "FEFO" here — it's whatever
// the SKU's allocationSortField/allocationSortDirection say (see
// src/db/schema/inventory.ts), so LEFO or any other rule stays admin
// configurable per SKU rather than baked into this function.

export type AllocationSortField = 'received_date' | 'expiry_date';
export type AllocationSortDirection = 'asc' | 'desc';

export type AllocationRule = {
  sortField: AllocationSortField;
  sortDirection: AllocationSortDirection;
};

export type AllocatableLot = {
  id: string;
  qty: number;
  receivedDate: string;
  expiryDate: string | null;
};

export type AllocationPick = {
  lotId: string;
  qty: number;
};

export type AllocationResult = {
  picks: AllocationPick[];
  fulfilledQty: number;
  shortfallQty: number;
};

function sortValue(lot: AllocatableLot, field: AllocationSortField): string | null {
  return field === 'received_date' ? lot.receivedDate : lot.expiryDate;
}

export function allocateLots(
  lots: AllocatableLot[],
  requestedQty: number,
  rule: AllocationRule
): AllocationResult {
  if (requestedQty <= 0) {
    return { picks: [], fulfilledQty: 0, shortfallQty: 0 };
  }

  const sorted = lots.toSorted((a, b) => {
    const aValue = sortValue(a, rule.sortField);
    const bValue = sortValue(b, rule.sortField);

    // Lots missing the configured sort field (e.g. no expiry date under a
    // FEFO/LEFO rule) sort last regardless of direction — there's no value
    // to rank them by.
    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return rule.sortDirection === 'asc' ? comparison : -comparison;
  });

  const picks: AllocationPick[] = [];
  let remaining = requestedQty;

  for (const lot of sorted) {
    if (remaining <= 0) break;
    if (lot.qty <= 0) continue;

    const pickQty = Math.min(lot.qty, remaining);
    picks.push({ lotId: lot.id, qty: pickQty });
    remaining -= pickQty;
  }

  return {
    picks,
    fulfilledQty: requestedQty - remaining,
    shortfallQty: remaining
  };
}
