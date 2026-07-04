import type { AllocationSortDirection, AllocationSortField } from './allocation';

export type ReslottingLocation = {
  id: string;
  code: string;
  type: 'floor' | 'rack';
  distanceToDock: number | null;
  capacityVolume: number | null;
  capacityWeight: number | null;
};

export type ReslottingLot = {
  id: string;
  lotNo: string;
  skuId: string;
  locationId: string | null;
  locationCode: string | null;
  locationType: 'floor' | 'rack' | null;
  distanceToDock: number | null;
  receivedDate: string;
  expiryDate: string | null;
  qty: number;
  storageClass: string | null;
  weight: number | null;
  allocationSortField: AllocationSortField;
  allocationSortDirection: AllocationSortDirection;
};

export type ReslottingSuggestion = {
  lotId: string;
  lotNo: string;
  currentLocationId: string | null;
  currentLocationCode: string | null;
  currentDistanceToDock: number | null;
  recommendedLocationId: string | null;
  recommendedLocationCode: string | null;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  ruleApplied: string;
};

function getSortValue(lot: ReslottingLot): string | null {
  return lot.allocationSortField === 'received_date' ? lot.receivedDate : lot.expiryDate;
}

function compareLots(a: ReslottingLot, b: ReslottingLot): number {
  const av = getSortValue(a);
  const bv = getSortValue(b);
  if (!av && !bv) return 0;
  if (!av) return 1;
  if (!bv) return -1;
  const cmp = av < bv ? -1 : av > bv ? 1 : 0;
  return a.allocationSortDirection === 'asc' ? cmp : -cmp;
}

function locationScore(location: ReslottingLocation, lot: ReslottingLot): number {
  const distanceScore = location.distanceToDock ?? 999;
  const typePenalty = lot.weight && lot.weight > 500 && location.type === 'rack' ? 120 : 0;
  const storagePenalty =
    lot.storageClass?.toLowerCase().includes('fifo') && location.type === 'floor' ? 0 : 0;
  return distanceScore + typePenalty + storagePenalty;
}

export function computeReslottingSuggestions(
  lots: ReslottingLot[],
  locations: ReslottingLocation[]
): ReslottingSuggestion[] {
  const occupiedLocationIds = new Set(lots.map((lot) => lot.locationId).filter(Boolean));
  const locationMap = new Map(locations.map((location) => [location.id, location]));
  const suggestions: ReslottingSuggestion[] = [];
  const lotsBySku = new Map<string, ReslottingLot[]>();

  for (const lot of lots) {
    if (!lotsBySku.has(lot.skuId)) lotsBySku.set(lot.skuId, []);
    lotsBySku.get(lot.skuId)!.push(lot);
  }

  for (const skuLots of lotsBySku.values()) {
    if (skuLots.length === 0) continue;

    const sortedLots = [...skuLots].sort(compareLots);
    const availableLocations = locations
      .filter(
        (location) =>
          !occupiedLocationIds.has(location.id) ||
          sortedLots.some((lot) => lot.locationId === location.id)
      )
      .sort((a, b) => locationScore(a, sortedLots[0]) - locationScore(b, sortedLots[0]));

    for (const lot of sortedLots) {
      const currentDistance = lot.distanceToDock ?? 999;
      const bestLocation = [...availableLocations]
        .sort((a, b) => locationScore(a, lot) - locationScore(b, lot))
        .find((location) => location.id !== lot.locationId);

      if (!bestLocation) continue;

      const recommendedDistance = bestLocation.distanceToDock ?? 999;
      if (recommendedDistance >= currentDistance - 2) continue;

      const ruleApplied =
        lot.allocationSortField === 'expiry_date'
          ? lot.allocationSortDirection === 'asc'
            ? 'FEFO'
            : 'LEFO'
          : 'FIFO';
      const priority =
        recommendedDistance + 10 < currentDistance
          ? 'high'
          : recommendedDistance + 4 < currentDistance
            ? 'medium'
            : 'low';

      suggestions.push({
        lotId: lot.id,
        lotNo: lot.lotNo,
        currentLocationId: lot.locationId,
        currentLocationCode: lot.locationCode,
        currentDistanceToDock: lot.distanceToDock,
        recommendedLocationId: bestLocation.id,
        recommendedLocationCode: bestLocation.code,
        reason:
          ruleApplied === 'FIFO'
            ? `Lot nhap truoc nen can dua gan dock hon de xuat theo thu tu.`
            : ruleApplied === 'FEFO'
              ? `Lot can xuat som theo han dung, vi tri hien tai dang xa dock hon muc can thiet.`
              : `Lot co han dung dai dang nam o vi tri qua thuan loi so voi lot can xuat truoc.`,
        priority,
        ruleApplied
      });
    }
  }

  return suggestions.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.priority] - rank[b.priority];
  });
}
