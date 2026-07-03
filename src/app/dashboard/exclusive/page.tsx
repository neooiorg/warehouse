'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization, Show } from '@clerk/nextjs';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function ExclusivePage() {
  const { organization, isLoaded } = useOrganization();

  return (
    <PageContainer isLoading={!isLoaded}>
      <Show
        when={{ plan: 'pro' }}
        fallback={
          <div className='flex h-full items-center justify-center'>
            <Alert>
              <Icons.lock className='h-5 w-5 text-yellow-600' />
              <AlertDescription>
                <div className='mb-1 text-lg font-semibold'>Cần gói Pro</div>
                <div className='text-muted-foreground'>
                  Trang này chỉ mở cho tổ chức dùng gói <span className='font-semibold'>Pro</span>.
                  <br />
                  Nâng cấp tại&nbsp;
                  <Link className='underline' href='/dashboard/billing'>
                    Thanh toán và gói
                  </Link>
                  .
                </div>
              </AlertDescription>
            </Alert>
          </div>
        }
      >
        <div className='space-y-6'>
          <div>
            <h1 className='flex items-center gap-2 text-3xl font-bold tracking-tight'>
              <Icons.badgeCheck className='h-7 w-7 text-green-600' />
              Khu vực Pro
            </h1>
            <p className='text-muted-foreground'>
              Xin chào <span className='font-semibold'>{organization?.name}</span>. Các tính năng
              trong trang này dành cho tổ chức dùng gói Pro.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Tính năng Pro đã sẵn sàng</CardTitle>
              <CardDescription>Tổ chức của bạn đang dùng gói Pro.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-lg'>Bạn có thể dùng các công cụ nâng cao tại đây.</div>
            </CardContent>
          </Card>
        </div>
      </Show>
    </PageContainer>
  );
}
