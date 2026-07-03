import * as z from 'zod';

const MAX_FILE_SIZE = 5_000_000;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const productSchema = z.object({
  image: z
    .any()
    .refine((files) => files?.length == 1, 'Chọn ảnh sản phẩm.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, 'Dung lượng tối đa là 5MB.')
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      'Chỉ nhận file .jpg, .jpeg, .png hoặc .webp.'
    ),
  name: z.string().min(2, 'Tên sản phẩm cần ít nhất 2 ký tự.'),
  category: z.string().min(1, 'Chọn danh mục'),
  price: z.number({ message: 'Nhập giá' }),
  description: z.string().min(10, 'Mô tả cần ít nhất 10 ký tự.')
});

export type ProductFormValues = {
  image: File[] | undefined;
  name: string;
  category: string;
  price: number | undefined;
  description: string;
};
