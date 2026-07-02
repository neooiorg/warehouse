import * as z from 'zod';

export const inboundReceiptSchema = z.object({
  warehouseId: z.string().min(1, 'Please select a warehouse'),
  skuId: z.string().min(1, 'Please select a SKU'),
  locationId: z.string().min(1, 'Please select a location'),
  lotNo: z.string().min(1, 'Lot number is required'),
  qty: z.number({ message: 'Quantity is required' }).positive('Quantity must be greater than 0'),
  receivedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')
    .optional()
    .or(z.literal('')),
  performedBy: z.string().optional(),
  note: z.string().optional()
});

export type InboundReceiptFormValues = z.infer<typeof inboundReceiptSchema>;
