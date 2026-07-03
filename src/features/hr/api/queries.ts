import { queryOptions } from '@tanstack/react-query';
import {
  getHrKpiMetrics,
  listStaffingPlans,
  getWorkTasks,
  listWorkflowTasks,
  listKpiTemplates
} from './service';

export const hrKeys = {
  all: ['hr'] as const,
  kpi: () => [...hrKeys.all, 'kpi'] as const,
  plans: () => [...hrKeys.all, 'plans'] as const,
  staffingPlans: () => hrKeys.plans(),
  tasks: (planId: string) => [...hrKeys.all, 'tasks', planId] as const,
  workflowTasks: () => [...hrKeys.all, 'workflow-tasks'] as const,
  kpiTemplates: () => [...hrKeys.all, 'kpi-templates'] as const
};

export const hrKpiOptions = () =>
  queryOptions({ queryKey: hrKeys.kpi(), queryFn: getHrKpiMetrics });

export const staffingPlanListOptions = () =>
  queryOptions({ queryKey: hrKeys.plans(), queryFn: listStaffingPlans });

export const workTaskListOptions = (planId: string) =>
  queryOptions({ queryKey: hrKeys.tasks(planId), queryFn: () => getWorkTasks(planId) });

export const turnoverMetricsQueryOptions = (_warehouseId?: string) => hrKpiOptions();
export const workflowTasksQueryOptions = () =>
  queryOptions({ queryKey: hrKeys.workflowTasks(), queryFn: listWorkflowTasks });

export const kpiTemplatesQueryOptions = () =>
  queryOptions({ queryKey: hrKeys.kpiTemplates(), queryFn: listKpiTemplates });
