export function estimateFreightCost(distanceKm: number, coveredQty: number): number {
  const baseFee = 180000;
  const distanceBandFee =
    distanceKm <= 30 ? 0 : distanceKm <= 100 ? 90000 : distanceKm <= 250 ? 220000 : 420000;
  const loadSurcharge = coveredQty <= 20 ? 0 : coveredQty <= 60 ? 140000 : 320000;
  return Math.round(baseFee + distanceBandFee + loadSurcharge);
}
