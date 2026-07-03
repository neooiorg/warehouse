import type { shipmentRequests, fuelPrices } from '@/db/schema';

export type ShipmentRequest = typeof shipmentRequests.$inferSelect;
export type FuelPrice = typeof fuelPrices.$inferSelect;

export type ShipmentRequestFilters = {
  status?: ShipmentRequest['status'];
  skuId?: string;
  page?: number;
  limit?: number;
};

export type RouteOption = {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  availableQty: number;
  distanceKm: number;
  estimatedHours: number;
};

export type FindSourcePayload = {
  skuId: string;
  qtyRequired: number;
  destinationLat: number;
  destinationLng: number;
  destinationAddress?: string;
};

export type FulfillShipmentPayload = {
  requestId: string;
  resolvedWarehouseId: string;
};

export type FuelPriceFilters = {
  region?: string;
  fuelType?: FuelPrice['fuelType'];
  dateFrom?: string;
  dateTo?: string;
};
