// FIFO/FEFO/LEFO storage slot optimizer

export type LotInput = {
  id: string;
  skuId: string;
  qty: number;
  expiryDate?: string | null; // ISO date
  receiveDate: string; // ISO date — for FIFO
  currentLocationId?: string | null;
  weight?: number; // kg per unit
  strategy?: 'FIFO' | 'FEFO' | 'LEFO'; // per SKU config
};

export type LocationInput = {
  id: string;
  level?: number | null; // 1 = ground, higher = upper rack
  distanceToDock?: number | null; // meters; lower = closer to dock
  capacityPallets?: number | null;
  zoneId?: string | null;
  currentLotIds?: string[];
};

export type SlottingRecommendation = {
  lotId: string;
  fromLocationId: string | null;
  toLocationId: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
};

export function runStorageOptimizer(
  lots: LotInput[],
  locations: LocationInput[]
): SlottingRecommendation[] {
  const recommendations: SlottingRecommendation[] = [];
  const now = new Date();

  // Available locations sorted by proximity to dock (ascending)
  const availableLocations = locations
    .filter((l) => (l.capacityPallets ?? 1) > (l.currentLotIds?.length ?? 0))
    .sort((a, b) => (a.distanceToDock ?? 999) - (b.distanceToDock ?? 999));

  const assignedLocationIds = new Set<string>();

  // Sort lots by priority
  const sortedLots = [...lots].sort((a, b) => {
    const strategy = a.strategy ?? 'FEFO';
    if (strategy === 'FEFO') {
      const ea = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
      const eb = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
      return ea - eb; // earliest expiry first
    }
    if (strategy === 'FIFO') {
      return new Date(a.receiveDate).getTime() - new Date(b.receiveDate).getTime();
    }
    // LEFO: last-expiry first (put longest shelf life nearest dock for pick speed)
    const ea = a.expiryDate ? new Date(a.expiryDate).getTime() : 0;
    const eb = b.expiryDate ? new Date(b.expiryDate).getTime() : 0;
    return eb - ea;
  });

  for (const lot of sortedLots) {
    // Skip if already in optimal position
    const daysToExpiry = lot.expiryDate
      ? (new Date(lot.expiryDate).getTime() - now.getTime()) / 86400000
      : Infinity;

    const isUrgent = daysToExpiry < 30;
    const isHeavy = (lot.weight ?? 0) > 500; // heavy → ground level preferred

    // Find best available location
    let bestLocation: LocationInput | null = null;

    for (const loc of availableLocations) {
      if (assignedLocationIds.has(loc.id)) continue;
      if (loc.id === lot.currentLocationId) continue;

      // Heavy items prefer ground level
      if (isHeavy && (loc.level ?? 1) > 1) continue;

      bestLocation = loc;
      break;
    }

    if (!bestLocation) continue;
    if (bestLocation.id === lot.currentLocationId) continue;

    assignedLocationIds.add(bestLocation.id);

    recommendations.push({
      lotId: lot.id,
      fromLocationId: lot.currentLocationId ?? null,
      toLocationId: bestLocation.id,
      reason: isUrgent
        ? `Hàng sắp hết hạn (${Math.round(daysToExpiry)} ngày) — chuyển ra gần dock`
        : isHeavy
          ? 'Hàng nặng — chuyển xuống tầng thấp'
          : 'Tối ưu vị trí theo chiến lược lưu trữ',
      priority: isUrgent ? 'high' : isHeavy ? 'medium' : 'low'
    });
  }

  return recommendations.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return p[a.priority] - p[b.priority];
  });
}
