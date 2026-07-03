import * as z from 'zod';

export const outboundShipmentSchema = z.object({
  warehouseId: z.string().min(1, 'Chọn kho'),
  skuId: z.string().min(1, 'Chọn SKU'),
  qty: z.number({ message: 'Nhập số lượng' }).positive('Số lượng phải lớn hơn 0'),
  performedBy: z.string().optional(),
  note: z.string().optional()
});

export type OutboundShipmentFormValues = z.infer<typeof outboundShipmentSchema>;
