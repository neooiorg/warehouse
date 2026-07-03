export type FuelPrice = {
  id: string;
  fuelType: 'ron95' | 'ron92' | 'diesel' | 'e5';
  pricePerLiter: number;
  effectiveDate: string;
  source: string | null;
  orgId: string | null;
};

export type DeliveryOrder = {
  id: string;
  orgId: string;
  warehouseId: string;
  destination: string;
  destinationLat: number | null;
  destinationLng: number | null;
  requiredSkus: string[];
  preferredDate: string | null;
  status: 'pending' | 'planned' | 'dispatched' | 'delivered';
};

export type CreateDeliveryOrderPayload = {
  warehouseId?: string | null;
  destination?: string;
  destinationLat?: number | null;
  destinationLng?: number | null;
  requiredSkus?: string[];
  preferredDate?: string | null;
  skuId?: string;
  qtyRequired?: number;
  destinationAddress?: string;
  requestDate?: string;
};

export type FindSourcePayload = {
  skuId?: string;
  qtyRequired?: number;
  destinationLat?: number;
  destinationLng?: number;
  destinationAddress?: string;
};

export type FulfillShipmentPayload = {
  id: string;
};

export type RouteOption = {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  availableQty: number;
  distanceKm: number;
  estimatedHours: number;
};
