import { queryOptions } from '@tanstack/react-query';
import {
  getWarehouseOptions,
  getLocationOptions,
  getProductSkuOptions,
  getEmployeeOptions
} from './service';

export type { WarehouseOption, LocationOption, ProductSkuOption, EmployeeOption } from './types';

export const masterDataKeys = {
  all: ['master-data'] as const,
  warehouses: () => [...masterDataKeys.all, 'warehouses'] as const,
  locations: (warehouseId: string) => [...masterDataKeys.all, 'locations', warehouseId] as const,
  productSkus: () => [...masterDataKeys.all, 'product-skus'] as const,
  employees: () => [...masterDataKeys.all, 'employees'] as const
};

export const warehouseOptionsQuery = () =>
  queryOptions({
    queryKey: masterDataKeys.warehouses(),
    queryFn: () => getWarehouseOptions()
  });

export const locationOptionsQuery = (warehouseId: string) =>
  queryOptions({
    queryKey: masterDataKeys.locations(warehouseId),
    queryFn: () => getLocationOptions(warehouseId),
    enabled: !!warehouseId
  });

export const productSkuOptionsQuery = () =>
  queryOptions({
    queryKey: masterDataKeys.productSkus(),
    queryFn: () => getProductSkuOptions()
  });

export const employeeOptionsQuery = () =>
  queryOptions({
    queryKey: masterDataKeys.employees(),
    queryFn: () => getEmployeeOptions()
  });
