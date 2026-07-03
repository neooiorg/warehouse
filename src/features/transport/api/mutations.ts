import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createShipmentRequest, fulfillShipmentRequest, findOptimalSourceWarehouses } from './service';
import { transportKeys } from './queries';
import type { FindSourcePayload, FulfillShipmentPayload } from './types';

export const createShipmentRequestMutation = mutationOptions({
  mutationFn: (data: Parameters<typeof createShipmentRequest>[0]) => createShipmentRequest(data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: transportKeys.all })
});

export const fulfillShipmentRequestMutation = mutationOptions({
  mutationFn: (data: FulfillShipmentPayload) => fulfillShipmentRequest(data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: transportKeys.all })
});

export const findSourceWarehousesMutation = mutationOptions({
  mutationFn: (data: FindSourcePayload) => findOptimalSourceWarehouses(data)
});
