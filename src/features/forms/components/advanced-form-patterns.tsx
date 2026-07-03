'use client';

import * as React from 'react';
import {
  useAppForm,
  useFormFields,
  FormErrors,
  scrollToFirstError
} from '@/components/ui/tanstack-form';
import { useStore } from '@tanstack/react-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdvancedFormValues = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  team: {
    name: string;
    size: number;
  };
  members: Array<{ name: string; role: string }>;
  country: string;
  state: string;
};

// ---------------------------------------------------------------------------
// Country / State data
// ---------------------------------------------------------------------------

const countryStateMap: Record<string, { value: string; label: string }[]> = {
  us: [
    { value: 'ca', label: 'California' },
    { value: 'ny', label: 'New York' },
    { value: 'tx', label: 'Texas' }
  ],
  uk: [
    { value: 'ldn', label: 'London' },
    { value: 'mnc', label: 'Manchester' },
    { value: 'brm', label: 'Birmingham' }
  ],
  au: [
    { value: 'nsw', label: 'New South Wales' },
    { value: 'vic', label: 'Victoria' },
    { value: 'qld', label: 'Queensland' }
  ]
};

const countryOptions = [
  { value: 'us', label: 'Mỹ' },
  { value: 'uk', label: 'Vương quốc Anh' },
  { value: 'au', label: 'Úc' }
];

// ---------------------------------------------------------------------------
// Form-level Zod schema (cross-field validation on submit)
// ---------------------------------------------------------------------------

const advancedSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(1),
  team: z.object({
    name: z.string().min(2),
    size: z.number().min(1).max(100)
  }),
  members: z
    .array(
      z.object({
        name: z.string().min(1, 'Nhập tên thành viên'),
        role: z.string().min(1, 'Nhập vai trò')
      })
    )
    .min(1, 'Thêm ít nhất một thành viên'),
  country: z.string().min(1, 'Chọn quốc gia'),
  state: z.string().min(1, 'Chọn tỉnh hoặc vùng')
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdvancedFormPatterns() {
  const form = useAppForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      team: {
        name: '',
        size: 1
      },
      members: [{ name: '', role: '' }],
      country: '',
      state: ''
    } as AdvancedFormValues,
    validators: {
      onSubmit: advancedSchema
    },
    onSubmit: () => {
      toast.success('Đã đăng ký nhóm');
    },
    onSubmitInvalid: () => {
      scrollToFirstError();
    }
  });

  const { FormTextField, FormSelectField } = useFormFields<AdvancedFormValues>();

  // Read current country reactively for dependent state field
  const selectedCountry = useStore(form.store, (s) => s.values.country);
  const stateOptions = countryStateMap[selectedCountry] ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>Đăng ký nhóm</CardTitle>
        <p className='text-muted-foreground'>
          Ví dụ validation bất đồng bộ, field phụ thuộc, object lồng nhau, mảng động và lỗi cấp
          form.
        </p>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-6'>
            {/* Form-level error display */}
            <FormErrors />

            {/* ─── Section 1: Account ─── */}
            <div className='space-y-1'>
              <h3 className='text-lg font-semibold'>Tài khoản</h3>
              <p className='text-muted-foreground text-sm'>
                Kiểm tra bất đồng bộ, trường phụ thuộc
              </p>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {/* Username — async validation (spinner built into FormTextField) */}
              <FormTextField
                name='username'
                label='Tên đăng nhập'
                required
                placeholder='Chọn tên đăng nhập'
                validators={{
                  onBlur: z.string().min(3, 'Tên đăng nhập cần ít nhất 3 ký tự'),
                  onChangeAsync: async ({ value }: { value: string }) => {
                    if (!value || value.length < 3) return undefined;
                    await new Promise((r) => setTimeout(r, 500));
                    if (value === 'admin' || value === 'test') {
                      return 'Tên đăng nhập đã được dùng';
                    }
                    return undefined;
                  },
                  onChangeAsyncDebounceMs: 500
                }}
              />

              {/* Email */}
              <FormTextField
                name='email'
                label='Email'
                required
                type='email'
                placeholder='ban@example.com'
                validators={{
                  onBlur: z.string().email('Email không hợp lệ')
                }}
              />

              {/* Password */}
              <FormTextField
                name='password'
                label='Mật khẩu'
                required
                type='password'
                placeholder='Tối thiểu 8 ký tự'
                validators={{
                  onBlur: z.string().min(8, 'Cần ít nhất 8 ký tự')
                }}
              />

              {/* Confirm Password — linked validation via AppField render prop */}
              <form.AppField
                name='confirmPassword'
                validators={{
                  onChangeListenTo: ['password'],
                  onChange: ({ value, fieldApi }) => {
                    const password = fieldApi.form.getFieldValue('password');
                    if (value !== password) return 'Mật khẩu không khớp';
                    return undefined;
                  },
                  onBlur: z.string().min(1, 'Xác nhận mật khẩu')
                }}
              >
                {(field) => (
                  <field.TextField
                    label='Xác nhận mật khẩu'
                    required
                    type='password'
                    placeholder='Nhập lại mật khẩu'
                  />
                )}
              </form.AppField>
            </div>

            <Separator />

            {/* ─── Section 2: Team Info (nested objects) ─── */}
            <div className='space-y-1'>
              <h3 className='text-lg font-semibold'>Thông tin nhóm</h3>
              <p className='text-muted-foreground text-sm'>
                Dữ liệu lồng nhau với đường dẫn dấu chấm
              </p>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormTextField
                name='team.name'
                label='Tên nhóm'
                required
                placeholder='Ví dụ: Ca vận hành A'
                validators={{
                  onBlur: z.string().min(2, 'Tên nhóm cần ít nhất 2 ký tự')
                }}
              />
              <FormTextField
                name='team.size'
                label='Quy mô nhóm'
                required
                type='number'
                min={1}
                max={100}
                placeholder='1-100'
                validators={{
                  onBlur: z
                    .number()
                    .min(1, 'Ít nhất 1 thành viên')
                    .max(100, 'Tối đa 100 thành viên')
                }}
              />
            </div>

            <Separator />

            {/* ─── Section 3: Members (dynamic array rows) ─── */}
            <div className='space-y-1'>
              <h3 className='text-lg font-semibold'>Thành viên</h3>
              <p className='text-muted-foreground text-sm'>
                Thêm hoặc xóa thành viên trong danh sách
              </p>
            </div>

            <form.AppField name='members' mode='array'>
              {(field) => (
                <div className='space-y-3'>
                  {field.state.value.map((_, i) => (
                    <div key={i} className='flex items-start gap-2'>
                      <form.AppField
                        name={`members[${i}].name`}
                        validators={{
                          onBlur: z.string().min(1, 'Nhập tên thành viên')
                        }}
                      >
                        {(subField) => (
                          <subField.FieldSet className='flex-1'>
                            <subField.Field>
                              <Input
                                placeholder='Tên thành viên'
                                value={subField.state.value}
                                onChange={(e) => subField.handleChange(e.target.value)}
                                onBlur={subField.handleBlur}
                              />
                            </subField.Field>
                            <subField.FieldError />
                          </subField.FieldSet>
                        )}
                      </form.AppField>
                      <form.AppField
                        name={`members[${i}].role`}
                        validators={{
                          onBlur: z.string().min(1, 'Nhập vai trò')
                        }}
                      >
                        {(subField) => (
                          <subField.FieldSet className='flex-1'>
                            <subField.Field>
                              <Input
                                placeholder='Vai trò'
                                value={subField.state.value}
                                onChange={(e) => subField.handleChange(e.target.value)}
                                onBlur={subField.handleBlur}
                              />
                            </subField.Field>
                            <subField.FieldError />
                          </subField.FieldSet>
                        )}
                      </form.AppField>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => field.removeValue(i)}
                      >
                        <Icons.close className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => field.pushValue({ name: '', role: '' })}
                  >
                    <Icons.add className='mr-2 h-4 w-4' /> Thêm thành viên
                  </Button>
                  {field.state.value.length > 0 && (
                    <div className='flex flex-wrap gap-1'>
                      {field.state.value
                        .filter((m) => m.name)
                        .map((m, idx) => (
                          <Badge key={idx} variant='secondary'>
                            {m.name}
                            {m.role ? ` (${m.role})` : ''}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </form.AppField>

            <Separator />

            {/* ─── Section 4: Preferences (listeners / side effects) ─── */}
            <div className='space-y-1'>
              <h3 className='text-lg font-semibold'>Tùy chọn</h3>
              <p className='text-muted-foreground text-sm'>
                Đổi quốc gia sẽ đặt lại tỉnh hoặc vùng
              </p>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormSelectField
                name='country'
                label='Quốc gia'
                required
                options={countryOptions}
                placeholder='Chọn quốc gia'
                validators={{
                  onBlur: z.string().min(1, 'Chọn quốc gia')
                }}
                listeners={{
                  onChange: ({ fieldApi }) => {
                    fieldApi.form.setFieldValue('state', '');
                  }
                }}
              />
              <FormSelectField
                name='state'
                label='Tỉnh / vùng'
                required
                options={stateOptions}
                placeholder={selectedCountry ? 'Chọn tỉnh hoặc vùng' : 'Chọn quốc gia trước'}
                validators={{
                  onBlur: z.string().min(1, 'Chọn tỉnh hoặc vùng')
                }}
              />
            </div>

            <Separator />

            {/* ─── Submit ─── */}
            <div className='flex gap-4 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => form.reset()}
                className='flex-1'
              >
                Đặt lại
              </Button>
              <form.SubmitButton className='flex-1'>Đăng ký nhóm</form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
