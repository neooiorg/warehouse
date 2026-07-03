import { queryOptions } from '@tanstack/react-query';
import { listFuelPrices, listDeliveryOrders } from './service';

export const transportKeys = {
  all: ['transport'] as const,
  fuelPrices: () => [...transportKeys.all, 'fuel-prices'] as const,
  orders: () => [...transportKeys.all, 'orders'] as const
};

export const fuelPricesOptions = () =>
  queryOptions({ queryKey: transportKeys.fuelPrices(), queryFn: () => listFuelPrices() });

export const deliveryOrdersOptions = () =>
  queryOptions({ queryKey: transportKeys.orders(), queryFn: listDeliveryOrders });

export const fuelPricesQueryOptions = fuelPricesOptions;
export const shipmentRequestsQueryOptions = deliveryOrdersOptions;
