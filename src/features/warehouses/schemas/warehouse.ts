import { z } from 'zod';

export const warehouseSchema = z.object({
  name: z.string().min(1, 'Tên kho không được để trống'),
  code: z.string().min(1, 'Mã kho không được để trống').max(20),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional()
});

export const zoneSchema = z.object({
  name: z.string().min(1, 'Tên khu vực không được để trống'),
  code: z.string().min(1, 'Mã khu vực không được để trống').max(20)
});

export const locationSchema = z.object({
  code: z.string().min(1, 'Mã vị trí không được để trống'),
  type: z.enum(['floor', 'rack']),
  zoneId: z.string().optional(),
  level: z.number().int().min(1).optional(),
  capacityVolume: z.number().positive().optional(),
  capacityWeight: z.number().positive().optional(),
  distanceToDock: z.number().nonnegative().optional()
});

export const dockSchema = z.object({
  code: z.string().min(1, 'Mã cửa dock không được để trống'),
  direction: z.enum(['inbound', 'outbound', 'both'])
});

export type WarehouseFormValues = z.infer<typeof warehouseSchema>;
export type ZoneFormValues = z.infer<typeof zoneSchema>;
export type LocationFormValues = z.infer<typeof locationSchema>;
export type DockFormValues = z.infer<typeof dockSchema>;
