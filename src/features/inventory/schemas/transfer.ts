import * as z from 'zod';

export const transferSchema = z.object({
  lotId: z.string().min(1, 'Please select a lot'),
  toLocationId: z.string().min(1, 'Please select a destination location'),
  qty: z.number({ message: 'Quantity is required' }).positive('Quantity must be greater than 0'),
  performedBy: z.string().optional(),
  note: z.string().optional()
});

export type TransferFormValues = z.infer<typeof transferSchema>;
