'use client';

import { useState } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SheetFormValues = {
  name: string;
  category: string;
  price: number | undefined;
  description: string;
};

type DialogFormValues = {
  rating: number;
  feedback: string;
};

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const categoryOptions = [
  { value: 'beauty', label: 'Làm đẹp' },
  { value: 'electronics', label: 'Điện tử' },
  { value: 'home', label: 'Nhà cửa & sân vườn' },
  { value: 'sports', label: 'Thể thao & dã ngoại' }
];

// ---------------------------------------------------------------------------
// Sheet Form
// ---------------------------------------------------------------------------

function SheetFormSection() {
  const [open, setOpen] = useState(false);

  const form = useAppForm({
    defaultValues: {
      name: '',
      category: '',
      price: undefined,
      description: ''
    } as SheetFormValues,
    onSubmit: ({ value }) => {
      toast.success('Đã tạo sản phẩm', {
        description: `${value.name} đã được thêm.`
      });
      setOpen(false);
      form.reset();
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } = useFormFields<SheetFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biểu mẫu dạng sheet</CardTitle>
        <CardDescription>
          Biểu mẫu tạo sản phẩm trong Sheet. Nút lưu nằm ở SheetFooter và liên kết với form bằng
          thuộc tính HTML <code className='bg-muted rounded px-1 text-sm'>form</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>
              <Icons.add className='mr-2 h-4 w-4' />
              Thêm sản phẩm
            </Button>
          </SheetTrigger>
          <SheetContent className='flex flex-col'>
            <SheetHeader>
              <SheetTitle>Sản phẩm mới</SheetTitle>
              <SheetDescription>Nhập thông tin cần thiết để tạo sản phẩm.</SheetDescription>
            </SheetHeader>

            <form.AppForm>
              <form.Form id='sheet-form-id' className='space-y-4 p-0 md:p-0'>
                <FormTextField
                  name='name'
                  label='Tên sản phẩm'
                  required
                  placeholder='Nhập tên sản phẩm'
                  validators={{
                    onBlur: z.string().min(2, 'Tên sản phẩm cần ít nhất 2 ký tự')
                  }}
                />

                <FormSelectField
                  name='category'
                  label='Danh mục'
                  required
                  options={categoryOptions}
                  placeholder='Chọn danh mục'
                  validators={{
                    onBlur: z.string().min(1, 'Chọn danh mục')
                  }}
                />

                <FormTextField
                  name='price'
                  label='Giá'
                  required
                  type='number'
                  min={0}
                  step='0.01'
                  placeholder='0.00'
                  validators={{
                    onBlur: z.number().min(0.01, 'Giá phải lớn hơn 0')
                  }}
                />

                <FormTextareaField
                  name='description'
                  label='Mô tả'
                  required
                  placeholder='Nhập mô tả sản phẩm'
                  maxLength={500}
                  rows={4}
                  validators={{
                    onBlur: z.string().min(10, 'Mô tả cần ít nhất 10 ký tự')
                  }}
                />
              </form.Form>
            </form.AppForm>

            <SheetFooter className='pt-4'>
              <Button type='button' variant='outline' onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button type='submit' form='sheet-form-id'>
                Tạo sản phẩm
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Dialog Form
// ---------------------------------------------------------------------------

function DialogFormSection() {
  const [open, setOpen] = useState(false);

  const form = useAppForm({
    defaultValues: {
      rating: 5,
      feedback: ''
    } as DialogFormValues,
    onSubmit: ({ value }) => {
      toast.success('Đã gửi phản hồi', {
        description: `Điểm: ${value.rating}/10. Cảm ơn bạn.`
      });
      setOpen(false);
      form.reset();
    }
  });

  const { FormSliderField, FormTextareaField } = useFormFields<DialogFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biểu mẫu dạng dialog</CardTitle>
        <CardDescription>
          Biểu mẫu phản hồi nhanh trong Dialog. Dùng các trường lấy từ{' '}
          <code className='bg-muted rounded px-1 text-sm'>useFormFields</code> và nút gửi trong
          DialogFooter.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant='outline'>
              <Icons.send className='mr-2 h-4 w-4' />
              Gửi phản hồi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Phản hồi nhanh</DialogTitle>
              <DialogDescription>Chấm điểm trải nghiệm và để lại nhận xét.</DialogDescription>
            </DialogHeader>

            <form.AppForm>
              <form.Form id='dialog-form-id' className='space-y-4 py-2'>
                <FormSliderField
                  name='rating'
                  label='Điểm'
                  description='Chấm điểm trải nghiệm từ 0 đến 10'
                  min={0}
                  max={10}
                  step={1}
                />

                <FormTextareaField
                  name='feedback'
                  label='Phản hồi'
                  required
                  placeholder='Nhập nhận xét của bạn...'
                  maxLength={300}
                  rows={3}
                  validators={{
                    onBlur: z.string().min(5, 'Phản hồi cần ít nhất 5 ký tự')
                  }}
                />
              </form.Form>
            </form.AppForm>

            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button type='submit' form='dialog-form-id'>
                Gửi phản hồi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Toast Demo
// ---------------------------------------------------------------------------

function ToastDemoSection() {
  return (
    <Card className='md:col-span-2'>
      <CardHeader>
        <CardTitle>Toast thông báo</CardTitle>
        <CardDescription>Bấm từng nút để xem các kiểu toast.</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-wrap gap-2'>
        <Button variant='outline' onClick={() => toast('Thông báo mặc định')}>
          Mặc định
        </Button>
        <Button variant='outline' onClick={() => toast.success('Thao tác đã hoàn tất')}>
          <Icons.circleCheck className='mr-2 h-4 w-4' />
          Thành công
        </Button>
        <Button variant='outline' onClick={() => toast.error('Đã có lỗi xảy ra.')}>
          <Icons.circleX className='mr-2 h-4 w-4' />
          Lỗi
        </Button>
        <Button variant='outline' onClick={() => toast.warning('Kiểm tra lại trước khi tiếp tục.')}>
          <Icons.warning className='mr-2 h-4 w-4' />
          Cảnh báo
        </Button>
        <Button variant='outline' onClick={() => toast.info('Có thông tin cần lưu ý.')}>
          <Icons.info className='mr-2 h-4 w-4' />
          Thông tin
        </Button>
        <Button
          variant='outline'
          onClick={() =>
            toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
              loading: 'Đang tải...',
              success: 'Đã tải dữ liệu',
              error: 'Không tải được dữ liệu'
            })
          }
        >
          <Icons.spinner className='mr-2 h-4 w-4' />
          Tác vụ chờ
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Demo
// ---------------------------------------------------------------------------

export default function SheetFormDemo() {
  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
      <SheetFormSection />
      <DialogFormSection />
      <ToastDemoSection />
    </div>
  );
}
