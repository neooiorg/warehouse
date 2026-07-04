import { estimateFreightCost } from './freight';

export type WarehouseNode = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  availableQty: number;
};

export type Delivery = {
  destination: string;
  destinationLat: number;
  destinationLng: number;
  qtyRequired: number;
};

export type RouteStop = {
  warehouseId: string;
  warehouseName: string;
  lat: number;
  lng: number;
  pickupQty: number;
  distanceFromPreviousKm: number;
};

export type RouteResult = {
  stops: RouteStop[];
  totalDistanceKm: number;
  estimatedHours: number;
  coveredQty: number;
  coverageMode: 'single' | 'multi';
  fuelCostVnd?: number;
  freightCostVnd: number;
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function optimizeRoute(
  warehouses: WarehouseNode[],
  delivery: Delivery,
  options: {
    avgSpeedKmh?: number;
    fuelConsumptionPer100km?: number;
    fuelPricePerLiter?: number;
  } = {}
): RouteResult {
  const { avgSpeedKmh = 50, fuelConsumptionPer100km = 12, fuelPricePerLiter } = options;
  const eligible = warehouses.filter((warehouse) => warehouse.availableQty > 0);

  if (eligible.length === 0) {
    return {
      stops: [],
      totalDistanceKm: 0,
      estimatedHours: 0,
      coveredQty: 0,
      coverageMode: 'multi',
      freightCostVnd: 0
    };
  }

  const singleSource = eligible
    .filter((warehouse) => warehouse.availableQty >= delivery.qtyRequired)
    .sort(
      (a, b) =>
        haversine(a.lat, a.lng, delivery.destinationLat, delivery.destinationLng) -
        haversine(b.lat, b.lng, delivery.destinationLat, delivery.destinationLng)
    )[0];

  const chosenStops = singleSource
    ? [{ warehouse: singleSource, pickupQty: delivery.qtyRequired }]
    : eligible
        .sort(
          (a, b) =>
            haversine(a.lat, a.lng, delivery.destinationLat, delivery.destinationLng) -
            haversine(b.lat, b.lng, delivery.destinationLat, delivery.destinationLng)
        )
        .reduce<Array<{ warehouse: WarehouseNode; pickupQty: number }>>((acc, warehouse) => {
          const covered = acc.reduce((sum, item) => sum + item.pickupQty, 0);
          if (covered >= delivery.qtyRequired) return acc;
          const pickupQty = Math.min(warehouse.availableQty, delivery.qtyRequired - covered);
          if (pickupQty > 0) acc.push({ warehouse, pickupQty });
          return acc;
        }, []);

  if (chosenStops.length === 0) {
    return {
      stops: [],
      totalDistanceKm: 0,
      estimatedHours: 0,
      coveredQty: 0,
      coverageMode: 'multi',
      freightCostVnd: 0
    };
  }

  const routeOrder = [...chosenStops].sort(
    (a, b) =>
      haversine(
        a.warehouse.lat,
        a.warehouse.lng,
        delivery.destinationLat,
        delivery.destinationLng
      ) -
      haversine(b.warehouse.lat, b.warehouse.lng, delivery.destinationLat, delivery.destinationLng)
  );

  const furthestFirst = routeOrder.reverse();
  let previousLat = furthestFirst[0].warehouse.lat;
  let previousLng = furthestFirst[0].warehouse.lng;
  let totalDistanceKm = 0;

  const stops = furthestFirst.map((stop, index) => {
    const distanceFromPreviousKm =
      index === 0 ? 0 : haversine(previousLat, previousLng, stop.warehouse.lat, stop.warehouse.lng);
    previousLat = stop.warehouse.lat;
    previousLng = stop.warehouse.lng;
    totalDistanceKm += distanceFromPreviousKm;
    return {
      warehouseId: stop.warehouse.id,
      warehouseName: stop.warehouse.name,
      lat: stop.warehouse.lat,
      lng: stop.warehouse.lng,
      pickupQty: stop.pickupQty,
      distanceFromPreviousKm: Math.round(distanceFromPreviousKm * 10) / 10
    };
  });

  totalDistanceKm += haversine(
    previousLat,
    previousLng,
    delivery.destinationLat,
    delivery.destinationLng
  );
  totalDistanceKm = Math.round(totalDistanceKm * 10) / 10;

  const coveredQty = chosenStops.reduce((sum, stop) => sum + stop.pickupQty, 0);
  const estimatedHours = Math.round((totalDistanceKm / avgSpeedKmh) * 10) / 10;
  const fuelCostVnd = fuelPricePerLiter
    ? Math.round((totalDistanceKm / 100) * fuelConsumptionPer100km * fuelPricePerLiter)
    : undefined;

  return {
    stops,
    totalDistanceKm,
    estimatedHours,
    coveredQty,
    coverageMode: singleSource ? 'single' : 'multi',
    fuelCostVnd,
    freightCostVnd: estimateFreightCost(totalDistanceKm, coveredQty)
  };
}
