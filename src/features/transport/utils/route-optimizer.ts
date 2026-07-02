// Multi-warehouse route optimizer: Haversine + nearest-neighbor TSP

export type WarehouseNode = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  availableSkus?: string[]; // SKU IDs this warehouse can fulfill
};

export type Delivery = {
  destination: string;
  destinationLat: number;
  destinationLng: number;
  requiredSkus: string[];
};

export type RouteStop = {
  warehouseId: string;
  warehouseName: string;
  lat: number;
  lng: number;
  distanceFromPreviousKm: number;
};

export type RouteResult = {
  stops: RouteStop[];
  totalDistanceKm: number;
  estimatedHours: number;
  fuelCostVnd?: number;
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function optimizeRoute(
  warehouses: WarehouseNode[],
  delivery: Delivery,
  options: {
    avgSpeedKmh?: number;
    fuelConsumptionPer100km?: number; // liters
    fuelPricePerLiter?: number; // VND
  } = {}
): RouteResult {
  const { avgSpeedKmh = 50, fuelConsumptionPer100km = 12, fuelPricePerLiter } = options;

  if (warehouses.length === 0) {
    return { stops: [], totalDistanceKm: 0, estimatedHours: 0 };
  }

  // Filter warehouses that can fulfill required SKUs (if sku info provided)
  const eligible = warehouses.filter((w) => {
    if (!w.availableSkus || delivery.requiredSkus.length === 0) return true;
    return delivery.requiredSkus.some((sku) => w.availableSkus!.includes(sku));
  });

  if (eligible.length === 0) return { stops: [], totalDistanceKm: 0, estimatedHours: 0 };

  // If a single warehouse can fulfill all SKUs → pick closest
  const canFulfillAll = eligible.filter(
    (w) => !w.availableSkus || delivery.requiredSkus.every((sku) => w.availableSkus!.includes(sku))
  );

  let chosenWarehouses: WarehouseNode[];

  if (canFulfillAll.length > 0) {
    // Pick nearest single warehouse
    const sorted = canFulfillAll.sort(
      (a, b) =>
        haversine(a.lat, a.lng, delivery.destinationLat, delivery.destinationLng) -
        haversine(b.lat, b.lng, delivery.destinationLat, delivery.destinationLng)
    );
    chosenWarehouses = [sorted[0]];
  } else {
    // Need to collect from multiple warehouses — nearest-neighbor TSP
    const remaining = new Set(delivery.requiredSkus);
    const visited: WarehouseNode[] = [];
    let currentLat = delivery.destinationLat;
    let currentLng = delivery.destinationLng;
    const available = [...eligible];

    while (remaining.size > 0 && available.length > 0) {
      // Find nearest warehouse that covers any remaining SKU
      available.sort(
        (a, b) =>
          haversine(currentLat, currentLng, a.lat, a.lng) -
          haversine(currentLat, currentLng, b.lat, b.lng)
      );
      const next = available.shift()!;
      visited.push(next);
      currentLat = next.lat;
      currentLng = next.lng;
      if (next.availableSkus) {
        next.availableSkus.forEach((sku) => remaining.delete(sku));
      } else {
        remaining.clear();
      }
    }
    chosenWarehouses = visited.reverse(); // reverse: furthest first → end at delivery point
  }

  // Build route stops
  const stops: RouteStop[] = [];
  let prevLat = chosenWarehouses[0]?.lat ?? delivery.destinationLat;
  let prevLng = chosenWarehouses[0]?.lng ?? delivery.destinationLng;
  let totalDistance = 0;

  for (let i = 0; i < chosenWarehouses.length; i++) {
    const w = chosenWarehouses[i];
    const dist = i === 0 ? 0 : haversine(prevLat, prevLng, w.lat, w.lng);
    stops.push({
      warehouseId: w.id,
      warehouseName: w.name,
      lat: w.lat,
      lng: w.lng,
      distanceFromPreviousKm: Math.round(dist * 10) / 10
    });
    totalDistance += dist;
    prevLat = w.lat;
    prevLng = w.lng;
  }

  // Add final leg to destination
  const lastLeg = haversine(prevLat, prevLng, delivery.destinationLat, delivery.destinationLng);
  totalDistance += lastLeg;
  totalDistance = Math.round(totalDistance * 10) / 10;

  const estimatedHours = Math.round((totalDistance / avgSpeedKmh) * 10) / 10;

  const fuelCostVnd = fuelPricePerLiter
    ? Math.round((totalDistance / 100) * fuelConsumptionPer100km * fuelPricePerLiter)
    : undefined;

  return { stops, totalDistanceKm: totalDistance, estimatedHours, fuelCostVnd };
}
