import type { warehouses, zones, locations, docks } from '@/db/schema';

export type Warehouse = typeof warehouses.$inferSelect;
export type Zone = typeof zones.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Dock = typeof docks.$inferSelect;

export type WarehouseWithCounts = Warehouse & {
  zoneCount: number;
  locationCount: number;
  dockCount: number;
};

export type WarehouseFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

export type ZoneWithLocations = Zone & { locationCount: number };

export type CreateWarehousePayload = {
  name: string;
  code: string;
  address?: string;
  lat?: number;
  lng?: number;
};

export type UpdateWarehousePayload = Partial<CreateWarehousePayload> & { id: string };

export type CreateZonePayload = {
  warehouseId: string;
  name: string;
  code: string;
};

export type UpdateZonePayload = Partial<Omit<CreateZonePayload, 'warehouseId'>> & { id: string };

export type CreateLocationPayload = {
  warehouseId: string;
  zoneId?: string;
  code: string;
  type: 'floor' | 'rack';
  level?: number;
  capacityVolume?: number;
  capacityWeight?: number;
  distanceToDock?: number;
};

export type UpdateLocationPayload = Partial<Omit<CreateLocationPayload, 'warehouseId'>> & {
  id: string;
  posX?: number;
  posY?: number;
  posWidth?: number;
  posHeight?: number;
};

export type CreateDockPayload = {
  warehouseId: string;
  code: string;
  direction: 'inbound' | 'outbound' | 'both';
};

export type UpdateDockPayload = Partial<Omit<CreateDockPayload, 'warehouseId'>> & { id: string };
