import { queryOptions } from '@tanstack/react-query';
import { getEmployees, getTurnoverMetrics, getWorkflowTasks, getStaffingPlans, getKpiTemplates } from './service';
import type { EmployeeFilters } from './types';

export const hrKeys = {
  all: ['hr'] as const,
  employees: (filters: EmployeeFilters) => [...hrKeys.all, 'employees', filters] as const,
  turnoverMetrics: (warehouseId?: string) => [...hrKeys.all, 'turnover', warehouseId] as const,
  workflowTasks: () => [...hrKeys.all, 'workflow-tasks'] as const,
  staffingPlans: (warehouseId?: string) => [...hrKeys.all, 'staffing-plans', warehouseId] as const,
  kpiTemplates: (role?: string) => [...hrKeys.all, 'kpi-templates', role] as const
};

export const employeesQueryOptions = (filters: EmployeeFilters) =>
  queryOptions({ queryKey: hrKeys.employees(filters), queryFn: () => getEmployees(filters) });

export const turnoverMetricsQueryOptions = (warehouseId?: string) =>
  queryOptions({ queryKey: hrKeys.turnoverMetrics(warehouseId), queryFn: () => getTurnoverMetrics(warehouseId) });

export const workflowTasksQueryOptions = () =>
  queryOptions({ queryKey: hrKeys.workflowTasks(), queryFn: () => getWorkflowTasks() });

export const staffingPlansQueryOptions = (warehouseId?: string) =>
  queryOptions({ queryKey: hrKeys.staffingPlans(warehouseId), queryFn: () => getStaffingPlans(warehouseId) });

export const kpiTemplatesQueryOptions = (role?: string) =>
  queryOptions({ queryKey: hrKeys.kpiTemplates(role), queryFn: () => getKpiTemplates(role) });
