import { queryOptions } from '@tanstack/react-query';
import { getShipmentRequests, getFuelPrices } from './service';
import type { ShipmentRequestFilters, FuelPriceFilters } from './types';

export const transportKeys = {
  all: ['transport'] as const,
  shipments: (filters: ShipmentRequestFilters) => [...transportKeys.all, 'shipments', filters] as const,
  fuelPrices: (filters: FuelPriceFilters) => [...transportKeys.all, 'fuel-prices', filters] as const
};

export const shipmentRequestsQueryOptions = (filters: ShipmentRequestFilters) =>
  queryOptions({ queryKey: transportKeys.shipments(filters), queryFn: () => getShipmentRequests(filters) });

export const fuelPricesQueryOptions = (filters: FuelPriceFilters = {}) =>
  queryOptions({ queryKey: transportKeys.fuelPrices(filters), queryFn: () => getFuelPrices(filters) });
