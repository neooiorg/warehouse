'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icons } from '@/components/icons';

export default function OverviewError({ error }: { error: Error }) {
  return (
    <Alert variant='destructive'>
      <Icons.alertCircle className='h-4 w-4' />
      <AlertTitle>Không tải được dữ liệu</AlertTitle>
      <AlertDescription>Không tải được thống kê: {error.message}</AlertDescription>
    </Alert>
  );
}
