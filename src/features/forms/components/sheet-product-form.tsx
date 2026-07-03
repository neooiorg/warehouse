'use client';

import { useAppForm } from '@/components/ui/tanstack-form';
import * as z from 'zod';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { useState } from 'react';

const productSchema = z.object({
  name: z.string().min(2, 'Tên sản phẩm cần ít nhất 2 ký tự'),
  category: z.string().min(1, 'Chọn danh mục'),
  price: z.number().min(0.01, 'Giá phải lớn hơn 0'),
  description: z.string().min(10, 'Mô tả cần ít nhất 10 ký tự')
});

export default function SheetProductForm() {
  const [open, setOpen] = useState(false);

  const form = useAppForm({
    defaultValues: {
      name: '',
      category: '',
      price: undefined as number | undefined,
      description: ''
    },
    validators: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TanStack Form validator type mismatch with Zod
      onSubmit: productSchema as any
    },
    onSubmit: () => {
      alert('Đã tạo sản phẩm');
      setOpen(false);
      form.reset();
    }
  });

  return (
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

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='sheet-product-form' className='space-y-4'>
              <form.AppField
                name='name'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel htmlFor={field.name}>Tên sản phẩm *</field.FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder='Nhập tên sản phẩm'
                          aria-invalid={isInvalid}
                        />
                      </field.Field>
                      <field.FieldError />
                    </field.FieldSet>
                  );
                }}
              />

              <form.AppField
                name='category'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel htmlFor={field.name}>Danh mục *</field.FieldLabel>
                        <Select
                          name={field.name}
                          value={field.state.value}
                          onValueChange={field.handleChange}
                        >
                          <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                            <SelectValue placeholder='Chọn danh mục' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='beauty'>Làm đẹp</SelectItem>
                            <SelectItem value='electronics'>Điện tử</SelectItem>
                            <SelectItem value='home'>Nhà cửa & sân vườn</SelectItem>
                            <SelectItem value='sports'>Thể thao & dã ngoại</SelectItem>
                          </SelectContent>
                        </Select>
                      </field.Field>
                      <field.FieldError />
                    </field.FieldSet>
                  );
                }}
              />

              <form.AppField
                name='price'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel htmlFor={field.name}>Giá *</field.FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type='number'
                          min={0}
                          step='0.01'
                          value={field.state.value ?? ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.handleChange(v === '' ? undefined : parseFloat(v));
                          }}
                          placeholder='Nhập giá'
                          aria-invalid={isInvalid}
                        />
                      </field.Field>
                      <field.FieldError />
                    </field.FieldSet>
                  );
                }}
              />

              <form.AppField
                name='description'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel htmlFor={field.name}>Mô tả *</field.FieldLabel>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder='Nhập mô tả sản phẩm'
                          maxLength={500}
                          rows={4}
                          aria-invalid={isInvalid}
                        />
                        <div className='text-muted-foreground text-right text-sm'>
                          {field.state.value?.length || 0} / 500
                        </div>
                      </field.Field>
                      <field.FieldError />
                    </field.FieldSet>
                  );
                }}
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button type='submit' form='sheet-product-form'>
            Tạo sản phẩm
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
