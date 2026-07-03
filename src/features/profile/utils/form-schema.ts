import * as z from 'zod';

export const profileSchema = z.object({
  firstname: z.string().min(3, { message: 'Tên cần ít nhất 3 ký tự' }),
  lastname: z.string().min(3, { message: 'Họ cần ít nhất 3 ký tự' }),
  email: z.string().email({ message: 'Email không hợp lệ' }),
  contactno: z.coerce.number(),
  country: z.string().min(1, { message: 'Chọn quốc gia' }),
  city: z.string().min(1, { message: 'Chọn thành phố' }),
  // jobs array is for the dynamic fields
  jobs: z.array(
    z.object({
      jobcountry: z.string().min(1, { message: 'Chọn quốc gia làm việc' }),
      jobcity: z.string().min(1, { message: 'Chọn thành phố làm việc' }),
      jobtitle: z.string().min(3, { message: 'Chức danh cần ít nhất 3 ký tự' }),
      employer: z.string().min(3, { message: 'Tên công ty cần ít nhất 3 ký tự' }),
      startdate: z.string().refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
        message: 'Ngày bắt đầu cần đúng định dạng YYYY-MM-DD'
      }),
      enddate: z.string().refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
        message: 'Ngày kết thúc cần đúng định dạng YYYY-MM-DD'
      })
    })
  )
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
