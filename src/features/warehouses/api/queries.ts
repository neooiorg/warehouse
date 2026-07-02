import { queryOptions } from '@tanstack/react-query';
import { listWarehouses, getWarehouse, listZones, listLocations, listDocks } from './service';
import type { WarehouseFilters } from './types';

export const warehouseKeys = {
  all: ['warehouses'] as const,
  list: (filters: WarehouseFilters) => [...warehouseKeys.all, 'list', filters] as const,
  detail: (id: string) => [...warehouseKeys.all, 'detail', id] as const,
  zones: (warehouseId: string) => [...warehouseKeys.all, warehouseId, 'zones'] as const,
  locations: (warehouseId: string) => [...warehouseKeys.all, warehouseId, 'locations'] as const,
  docks: (warehouseId: string) => [...warehouseKeys.all, warehouseId, 'docks'] as const
};

export const warehouseListOptions = (filters: WarehouseFilters) =>
  queryOptions({
    queryKey: warehouseKeys.list(filters),
    queryFn: () => listWarehouses(filters)
  });

export const warehouseDetailOptions = (id: string) =>
  queryOptions({
    queryKey: warehouseKeys.detail(id),
    queryFn: () => getWarehouse(id)
  });

export const zoneListOptions = (warehouseId: string) =>
  queryOptions({
    queryKey: warehouseKeys.zones(warehouseId),
    queryFn: () => listZones(warehouseId)
  });

export const locationListOptions = (warehouseId: string) =>
  queryOptions({
    queryKey: warehouseKeys.locations(warehouseId),
    queryFn: () => listLocations(warehouseId)
  });

export const dockListOptions = (warehouseId: string) =>
  queryOptions({
    queryKey: warehouseKeys.docks(warehouseId),
    queryFn: () => listDocks(warehouseId)
  });
