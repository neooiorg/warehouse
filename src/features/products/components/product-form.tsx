'use client';

import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createProductMutation, updateProductMutation } from '../api/mutations';
import type { Product } from '../api/types';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as z from 'zod';
import { productSchema, type ProductFormValues } from '@/features/products/schemas/product';
import { categoryOptions } from '@/features/products/constants/product-options';

export default function ProductForm({
  initialData,
  pageTitle
}: {
  initialData: Product | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const isEdit = !!initialData;

  const createMutation = useMutation({
    ...createProductMutation,
    onSuccess: () => {
      toast.success('Đã tạo sản phẩm');
      router.push('/dashboard/product');
    },
    onError: () => {
      toast.error('Không thể tạo sản phẩm');
    }
  });

  const updateMutation = useMutation({
    ...updateProductMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật sản phẩm');
      router.push('/dashboard/product');
    },
    onError: () => {
      toast.error('Không thể cập nhật sản phẩm');
    }
  });

  const form = useAppForm({
    defaultValues: {
      image: undefined,
      name: initialData?.name ?? '',
      category: initialData?.category ?? '',
      price: initialData?.price,
      description: initialData?.description ?? ''
    } as ProductFormValues,
    validators: {
      onSubmit: productSchema
    },
    onSubmit: ({ value }) => {
      const payload = {
        name: value.name,
        category: value.category,
        price: value.price!,
        description: value.description
      };

      if (isEdit) {
        updateMutation.mutate({ id: initialData.id, values: payload });
      } else {
        createMutation.mutate(payload);
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField, FormFileUploadField } =
    useFormFields<ProductFormValues>();

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-8'>
            <FormFileUploadField
              name='image'
              label='Ảnh sản phẩm'
              description='Tải ảnh sản phẩm lên'
              maxSize={5 * 1024 * 1024}
              maxFiles={4}
            />

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormTextField
                name='name'
                label='Tên sản phẩm'
                required
                placeholder='Nhập tên sản phẩm'
                validators={{
                  onBlur: z.string().min(2, 'Tên sản phẩm cần ít nhất 2 ký tự.')
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
                step={0.01}
                placeholder='Nhập giá'
                validators={{
                  onBlur: z.number({ message: 'Nhập giá' })
                }}
              />
            </div>

            <FormTextareaField
              name='description'
              label='Mô tả'
              required
              placeholder='Nhập mô tả sản phẩm'
              maxLength={500}
              rows={4}
              validators={{
                onBlur: z.string().min(10, 'Mô tả cần ít nhất 10 ký tự.')
              }}
            />

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => router.back()}>
                Quay lại
              </Button>
              <form.SubmitButton>{isEdit ? 'Cập nhật' : 'Thêm sản phẩm'}</form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
