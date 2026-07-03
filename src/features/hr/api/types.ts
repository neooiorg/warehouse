import type { employees, workflowTasks, staffingPlans, kpiTemplates } from '@/db/schema';

export type Employee = typeof employees.$inferSelect;
export type WorkflowTask = typeof workflowTasks.$inferSelect;
export type StaffingPlan = typeof staffingPlans.$inferSelect;
export type KpiTemplate = typeof kpiTemplates.$inferSelect;

export type EmployeeFilters = {
  warehouseId?: string;
  status?: Employee['status'];
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type TurnoverMetrics = {
  totalActive: number;
  totalTerminated: number;
  turnoverRate: number;
  avgTenureMonths: number;
  monthlyTrend: { month: string; hired: number; terminated: number }[];
};

export type AonNode = {
  id: string;
  name: string;
  estimatedMinutes: number;
  requiredRole: string | null;
  dependencies: string[];
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  float: number;
  isCritical: boolean;
};

export type StaffingResult = {
  nodes: AonNode[];
  criticalPath: string[];
  headcountByRole: Record<string, number>;
  totalDurationMinutes: number;
};

export type CreateWorkflowTaskPayload = {
  name: string;
  estimatedMinutes: number;
  requiredRole?: string | null;
  dependencies?: string[];
  sortOrder?: number;
};

export type ComputeStaffingPayload = {
  warehouseId?: string;
  planDate: string;
  dailyVolume: number;
  workHoursPerShift: number;
};

export type UpsertKpiTemplatePayload = {
  id?: string;
  role: string;
  kpiName: string;
  formula?: string | null;
  target?: number | null;
  unit?: string | null;
  weight?: number;
  isActive?: boolean;
};
