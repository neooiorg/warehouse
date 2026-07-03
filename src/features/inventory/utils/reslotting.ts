import type { AllocationSortField, AllocationSortDirection } from './allocation';

export type ReslottingLot = {
  id: string;
  lotNo: string;
  skuId: string;
  locationId: string | null;
  locationCode: string | null;
  distanceToDock: number | null;
  receivedDate: string;
  expiryDate: string | null;
  qty: number;
  storageClass: string | null;
  allocationSortField: AllocationSortField;
  allocationSortDirection: AllocationSortDirection;
};

export type ReslottingSuggestion = {
  lotId: string;
  lotNo: string;
  currentLocationId: string | null;
  currentLocationCode: string | null;
  currentDistanceToDock: number | null;
  reason: string;
  priority: 'high' | 'medium' | 'low';
};

function getSortValue(lot: ReslottingLot): string | null {
  return lot.allocationSortField === 'received_date' ? lot.receivedDate : lot.expiryDate;
}

export function computeReslottingSuggestions(lots: ReslottingLot[]): ReslottingSuggestion[] {
  // Group lots by SKU
  const bysku = new Map<string, ReslottingLot[]>();
  for (const lot of lots) {
    if (!bysku.has(lot.skuId)) bysku.set(lot.skuId, []);
    bysku.get(lot.skuId)!.push(lot);
  }

  const suggestions: ReslottingSuggestion[] = [];

  for (const [, skuLots] of bysku) {
    if (skuLots.length < 2) continue;

    const rule = skuLots[0];
    // Sort by allocation rule
    const sorted = [...skuLots].sort((a, b) => {
      const av = getSortValue(a);
      const bv = getSortValue(b);
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return rule.allocationSortDirection === 'asc' ? cmp : -cmp;
    });

    // The lot that should go out first (index 0) should be closest to dock
    for (let i = 0; i < sorted.length - 1; i++) {
      const shouldBeCloser = sorted[i];
      const shouldBeFurther = sorted[i + 1];
      const closerDist = shouldBeCloser.distanceToDock ?? 999;
      const furtherDist = shouldBeFurther.distanceToDock ?? 999;

      if (closerDist > furtherDist + 2) {
        const reason =
          rule.allocationSortField === 'expiry_date'
            ? `Lot sắp hết hạn (${shouldBeCloser.expiryDate}) đang ở vị trí xa dock hơn lot hết hạn sau`
            : `Lot nhập trước (${shouldBeCloser.receivedDate}) đang ở vị trí xa dock hơn lot nhập sau`;
        suggestions.push({
          lotId: shouldBeCloser.id,
          lotNo: shouldBeCloser.lotNo,
          currentLocationId: shouldBeCloser.locationId,
          currentLocationCode: shouldBeCloser.locationCode,
          currentDistanceToDock: closerDist,
          reason,
          priority: closerDist - furtherDist > 10 ? 'high' : 'medium'
        });
      }
    }
  }

  return suggestions.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}
