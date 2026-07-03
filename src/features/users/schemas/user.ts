import * as z from 'zod';

export const userSchema = z.object({
  first_name: z.string().min(2, 'Tên cần ít nhất 2 ký tự'),
  last_name: z.string().min(2, 'Họ cần ít nhất 2 ký tự'),
  email: z.string().email('Nhập email hợp lệ'),
  phone: z.string().min(1, 'Nhập số điện thoại'),
  role: z.string().min(1, 'Chọn vai trò'),
  status: z.string().min(1, 'Chọn trạng thái')
});

export type UserFormValues = z.infer<typeof userSchema>;
