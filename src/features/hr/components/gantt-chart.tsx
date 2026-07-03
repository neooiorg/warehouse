'use client';

import { cn } from '@/lib/utils';
import type { AonNode } from '../api/types';

export function GanttChart({ nodes, criticalPath }: { nodes: AonNode[]; criticalPath: string[] }) {
  if (nodes.length === 0) return null;

  const totalMinutes = Math.max(...nodes.map((node) => node.earliestFinish), 1);
  const tickCount = Math.min(Math.ceil(totalMinutes / 60), 12);
  const ticks = Array.from({ length: tickCount + 1 }, (_, index) =>
    Math.round((index * totalMinutes) / tickCount)
  );

  return (
    <div className='w-full overflow-x-auto rounded-lg border'>
      <div className='min-w-[720px]'>
        <div className='grid grid-cols-[220px_1fr] border-b bg-muted/40 text-xs text-muted-foreground'>
          <div className='border-r px-3 py-2 font-medium'>Đầu việc</div>
          <div className='relative flex h-9 items-end px-3 pb-2'>
            {ticks.map((tick) => (
              <span
                key={tick}
                className='absolute -translate-x-1/2'
                style={{ left: `${(tick / totalMinutes) * 100}%` }}
              >
                {tick}p
              </span>
            ))}
          </div>
        </div>

        <div className='divide-y'>
          {nodes.map((node) => {
            const isCritical = criticalPath.includes(node.id);
            const left = (node.earliestStart / totalMinutes) * 100;
            const width = Math.max(
              ((node.earliestFinish - node.earliestStart) / totalMinutes) * 100,
              2
            );

            return (
              <div key={node.id} className='grid min-h-14 grid-cols-[220px_1fr]'>
                <div className='flex flex-col justify-center border-r px-3 py-2'>
                  <span className='truncate text-sm font-medium'>{node.name}</span>
                  {node.requiredRole && (
                    <span className='truncate text-xs text-muted-foreground'>
                      {node.requiredRole}
                    </span>
                  )}
                </div>
                <div className='relative px-3 py-3'>
                  <div
                    className={cn(
                      'absolute top-1/2 h-6 -translate-y-1/2 rounded-sm',
                      isCritical ? 'bg-destructive' : 'bg-primary'
                    )}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                  <span
                    className='absolute top-1/2 -translate-y-1/2 px-2 text-xs font-medium text-primary-foreground'
                    style={{ left: `${left}%` }}
                  >
                    {node.earliestFinish - node.earliestStart}p
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
