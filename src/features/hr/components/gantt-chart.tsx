'use client';

import dynamic from 'next/dynamic';
import type { AonNode } from '../api/types';

import type { ViewMode as ViewModeType } from 'gantt-task-react';
// gantt-task-react uses browser APIs — load client-only
const GanttLib = dynamic(() => import('gantt-task-react').then((m) => m.Gantt), { ssr: false });

type GanttTask = {
  id: string;
  name: string;
  start: Date;
  end: Date;
  type: 'task';
  progress: number;
  styles?: { backgroundColor?: string; progressColor?: string };
  isDisabled?: boolean;
};

export function GanttChart({ nodes, criticalPath }: { nodes: AonNode[]; criticalPath: string[] }) {
  if (nodes.length === 0) return null;

  const base = new Date();
  base.setHours(8, 0, 0, 0);

  const tasks: GanttTask[] = nodes.map((n) => {
    const start = new Date(base.getTime() + n.earliestStart * 60000);
    const end = new Date(base.getTime() + n.earliestFinish * 60000);
    const isCritical = criticalPath.includes(n.id);
    return {
      id: n.id,
      name: `${n.name}${n.requiredRole ? ` (${n.requiredRole})` : ''}`,
      start,
      end,
      type: 'task',
      progress: 0,
      styles: isCritical
        ? { backgroundColor: 'var(--destructive)', progressColor: 'var(--destructive)' }
        : undefined
    };
  });

  return (
    <div className='w-full overflow-x-auto rounded-lg border'>
      <GanttLib
        tasks={tasks}
        viewMode={'Hour' as ViewModeType}
        listCellWidth='200px'
        columnWidth={60}
        barCornerRadius={4}
        todayColor='transparent'
      />
    </div>
  );
}
