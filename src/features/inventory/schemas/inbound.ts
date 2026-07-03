import * as z from 'zod';

export const inboundReceiptSchema = z.object({
  warehouseId: z.string().min(1, 'Chọn kho'),
  skuId: z.string().min(1, 'Chọn SKU'),
  locationId: z.string().min(1, 'Chọn vị trí'),
  lotNo: z.string().min(1, 'Nhập mã lot'),
  qty: z.number({ message: 'Nhập số lượng' }).positive('Số lượng phải lớn hơn 0'),
  receivedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Dùng định dạng YYYY-MM-DD'),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dùng định dạng YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  performedBy: z.string().optional(),
  note: z.string().optional()
});

export type InboundReceiptFormValues = z.infer<typeof inboundReceiptSchema>;
