'use client';

import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { workflowTasksQueryOptions } from '../api/queries';
import { deleteWorkflowTaskMutation } from '../api/mutations';
import { WorkflowTaskSheet } from './workflow-task-sheet';

export function WorkflowTaskEditor() {
  const { data: tasks } = useSuspenseQuery(workflowTasksQueryOptions());
  const deleteMutation = useMutation(deleteWorkflowTaskMutation);

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-sm'>Danh sách đầu việc</CardTitle>
        <WorkflowTaskSheet mode='create' />
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          {tasks.length === 0 && (
            <p className='text-sm text-muted-foreground'>Chưa có đầu việc nào. Thêm đầu việc để tính định biên.</p>
          )}
          {tasks.map((t) => (
            <div key={t.id} className='flex items-center justify-between rounded-md border px-3 py-2'>
              <div className='flex items-center gap-3'>
                <span className='text-sm font-medium'>{t.name}</span>
                <Badge variant='outline' className='text-xs'>{t.estimatedMinutes} phút</Badge>
                {t.requiredRole && <Badge variant='secondary' className='text-xs'>{t.requiredRole}</Badge>}
              </div>
              <div className='flex gap-1'>
                <WorkflowTaskSheet mode='edit' task={t} />
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7'
                  onClick={() => deleteMutation.mutate(t.id)}
                >
                  <Icons.trash className='h-3.5 w-3.5' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
