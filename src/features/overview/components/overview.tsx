import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaGraph } from './area-graph';
import { BarGraph } from './bar-graph';
import { PieGraph } from './pie-graph';
import { RecentSales } from './recent-sales';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';

export default function OverViewPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>Tổng quan vận hành</h2>
          <div className='hidden items-center space-x-2 md:flex'>
            <Button>Tải báo cáo</Button>
          </div>
        </div>
        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>Tổng quan</TabsTrigger>
            <TabsTrigger value='analytics' disabled>
              Phân tích
            </TabsTrigger>
          </TabsList>
          <TabsContent value='overview' className='space-y-4'>
            <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Doanh thu</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    $1,250.00
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline'>
                      <Icons.trendingUp />
                      +12.5%
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    Tăng trong tháng này <Icons.trendingUp className='size-4' />
                  </div>
                  <div className='text-muted-foreground'>Dữ liệu 6 tháng gần nhất</div>
                </CardFooter>
              </Card>
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Khách hàng mới</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    1,234
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline'>
                      <Icons.trendingDown />
                      -20%
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    Giảm 20% trong kỳ này <Icons.trendingDown className='size-4' />
                  </div>
                  <div className='text-muted-foreground'>Cần xem lại nguồn khách hàng</div>
                </CardFooter>
              </Card>
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Tài khoản hoạt động</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    45,678
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline'>
                      <Icons.trendingUp />
                      +12.5%
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    Tỷ lệ giữ chân tốt <Icons.trendingUp className='size-4' />
                  </div>
                  <div className='text-muted-foreground'>Mức sử dụng vượt mục tiêu</div>
                </CardFooter>
              </Card>
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Tốc độ tăng trưởng</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    4.5%
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline'>
                      <Icons.trendingUp />
                      +4.5%
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    Hiệu suất tăng ổn định <Icons.trendingUp className='size-4' />
                  </div>
                  <div className='text-muted-foreground'>Đạt kế hoạch tăng trưởng</div>
                </CardFooter>
              </Card>
            </div>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
              <div className='col-span-4'>
                <BarGraph />
              </div>
              <Card className='col-span-4 md:col-span-3'>
                <RecentSales />
              </Card>
              <div className='col-span-4'>
                <AreaGraph />
              </div>
              <div className='col-span-4 md:col-span-3'>
                <PieGraph />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
