import * as z from 'zod';

export const transferSchema = z.object({
  lotId: z.string().min(1, 'Chọn lô'),
  toLocationId: z.string().min(1, 'Chọn vị trí đích'),
  qty: z.number({ message: 'Nhập số lượng' }).positive('Số lượng phải lớn hơn 0'),
  performedBy: z.string().optional(),
  note: z.string().optional()
});

export type TransferFormValues = z.infer<typeof transferSchema>;
