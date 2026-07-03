'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@clerk/nextjs';
import { PricingTable } from '@clerk/nextjs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/icons';
import { billingInfoContent } from '@/config/infoconfig';

export default function BillingPage() {
  const { organization, isLoaded } = useOrganization();

  return (
    <PageContainer
      isLoading={!isLoaded}
      access={!!organization}
      accessFallback={
        <div className='flex min-h-[400px] items-center justify-center'>
          <div className='space-y-2 text-center'>
            <h2 className='text-2xl font-semibold'>Chưa chọn tổ chức</h2>
            <p className='text-muted-foreground'>
              Chọn hoặc tạo tổ chức để xem thông tin thanh toán.
            </p>
          </div>
        </div>
      }
      infoContent={billingInfoContent}
      pageTitle='Thanh toán và gói'
      pageDescription={`Quản lý gói và giới hạn sử dụng của ${organization?.name}`}
    >
      <div className='space-y-6'>
        {/* Info Alert */}
        <Alert>
          <Icons.info className='h-4 w-4' />
          <AlertDescription>
            Clerk Billing quản lý gói và thanh toán. Chọn gói phù hợp để mở giới hạn cao hơn.
          </AlertDescription>
        </Alert>

        {/* Clerk Pricing Table */}
        <Card>
          <CardHeader>
            <CardTitle>Gói hiện có</CardTitle>
            <CardDescription>Chọn gói phù hợp với tổ chức của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='mx-auto max-w-4xl'>
              <PricingTable for='organization' />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
