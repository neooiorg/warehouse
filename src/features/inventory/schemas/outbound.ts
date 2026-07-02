import * as z from 'zod';

export const outboundShipmentSchema = z.object({
  warehouseId: z.string().min(1, 'Please select a warehouse'),
  skuId: z.string().min(1, 'Please select a SKU'),
  qty: z.number({ message: 'Quantity is required' }).positive('Quantity must be greater than 0'),
  performedBy: z.string().optional(),
  note: z.string().optional()
});

export type OutboundShipmentFormValues = z.infer<typeof outboundShipmentSchema>;
