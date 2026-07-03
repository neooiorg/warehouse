'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTaskStore } from '../utils/store';

export default function NewTaskDialog() {
  const addTask = useTaskStore((state) => state.addTask);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const { title, description } = Object.fromEntries(formData);

    if (typeof title !== 'string' || typeof description !== 'string') return;
    addTask(title, description);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='secondary' size='sm'>
          + Thêm việc
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Thêm việc mới</DialogTitle>
          <DialogDescription>Nhập việc cần xử lý.</DialogDescription>
        </DialogHeader>
        <form id='task-form' className='grid gap-4 py-4' onSubmit={handleSubmit}>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Input id='title' name='title' placeholder='Tên việc' className='col-span-4' />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Textarea
              id='description'
              name='description'
              placeholder='Mô tả'
              className='col-span-4'
            />
          </div>
        </form>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button type='submit' size='sm' form='task-form'>
              Thêm việc
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
