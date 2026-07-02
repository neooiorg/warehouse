'use client';

import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { NotificationCard } from '@/components/ui/notification-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { notificationsQueryOptions } from '../api/queries';
import { markNotificationReadMutation, markAllNotificationsReadMutation } from '../api/mutations';
import { getActionsForSource, sourceActionRoutes } from '../constants/source-actions';
import type { Notification, NotificationSourceType } from '../api/types';

export default function NotificationsPage() {
  const router = useRouter();
  const { data: notifications } = useSuspenseQuery(notificationsQueryOptions());
  const markAsRead = useMutation(markNotificationReadMutation);
  const markAllAsRead = useMutation(markAllNotificationsReadMutation);

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const unreadNotifications = notifications.filter((n) => !n.readAt);
  const readNotifications = notifications.filter((n) => n.readAt);

  const renderList = (items: Notification[]) => {
    if (items.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-16'>
          <Icons.notification className='text-muted-foreground/40 mb-3 h-10 w-10' />
          <p className='text-muted-foreground text-sm'>No notifications</p>
        </div>
      );
    }

    return (
      <div className='flex flex-col gap-2'>
        {items.map((notification) => (
          <NotificationCard
            key={notification.id}
            id={notification.id}
            title={notification.title}
            body={notification.body ?? ''}
            status={notification.readAt ? 'read' : 'unread'}
            createdAt={notification.createdAt}
            actions={getActionsForSource(notification.sourceType)}
            onMarkAsRead={(id) => markAsRead.mutate(id)}
            onAction={(notifId, actionId) => {
              const route = sourceActionRoutes[actionId as NotificationSourceType];
              if (route) {
                markAsRead.mutate(notifId);
                router.push(route);
              }
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <PageContainer
      pageTitle='Notifications'
      pageDescription='View and manage all your notifications.'
      pageHeaderAction={
        unreadCount > 0 ? (
          <Button variant='outline' size='sm' onClick={() => markAllAsRead.mutate()}>
            Mark all as read
          </Button>
        ) : undefined
      }
    >
      <Tabs defaultValue='all'>
        <TabsList>
          <TabsTrigger value='all'>All ({notifications.length})</TabsTrigger>
          <TabsTrigger value='unread'>Unread ({unreadNotifications.length})</TabsTrigger>
          <TabsTrigger value='read'>Read ({readNotifications.length})</TabsTrigger>
        </TabsList>
        <TabsContent value='all' className='mt-4'>
          {renderList(notifications)}
        </TabsContent>
        <TabsContent value='unread' className='mt-4'>
          {renderList(unreadNotifications)}
        </TabsContent>
        <TabsContent value='read' className='mt-4'>
          {renderList(readNotifications)}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
