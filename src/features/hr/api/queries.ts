import { queryOptions } from '@tanstack/react-query';
import { getHrKpiMetrics, listStaffingPlans, getWorkTasks } from './service';

export const hrKeys = {
  all: ['hr'] as const,
  kpi: () => [...hrKeys.all, 'kpi'] as const,
  plans: () => [...hrKeys.all, 'plans'] as const,
  tasks: (planId: string) => [...hrKeys.all, 'tasks', planId] as const
};

export const hrKpiOptions = () =>
  queryOptions({ queryKey: hrKeys.kpi(), queryFn: getHrKpiMetrics });

export const staffingPlanListOptions = () =>
  queryOptions({ queryKey: hrKeys.plans(), queryFn: listStaffingPlans });

export const workTaskListOptions = (planId: string) =>
  queryOptions({ queryKey: hrKeys.tasks(planId), queryFn: () => getWorkTasks(planId) });
