import type { staffingPlans, workTasks, employees, workflowTasks, kpiTemplates } from '@/db/schema';

export type StaffingPlan = typeof staffingPlans.$inferSelect;
export type WorkTask = typeof workTasks.$inferSelect;
export type WorkflowTask = typeof workflowTasks.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type KpiTemplate = typeof kpiTemplates.$inferSelect;

export type HrKpiMetrics = {
  totalActive: number;
  totalTerminated: number;
  avgTenureMonths: number;
  turnoverRate: number;
  turnoverRatePercent: number;
  headcountTimeline: Array<{ month: string; hired: number; terminated: number; net: number }>;
  monthlyTrend: Array<{ month: string; hired: number; terminated: number; net: number }>;
};

export type CreatePlanPayload = {
  warehouseId?: string;
  name: string;
  availableHeadcount: number;
};

export type CreateTaskPayload = {
  planId: string;
  name: string;
  durationHours: number;
  predecessorIds: string[];
  requiredHeadcount: number;
  color?: string;
};

export type CreateWorkflowTaskPayload = {
  name: string;
  estimatedMinutes: number;
  requiredRole?: string | null;
  outputUnit?: string;
  standardRatePerHour?: number;
  kpiCategory?: string;
  dependencies?: string[];
  sortOrder?: number;
};

export type ComputeStaffingPayload = {
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
};

export type KpiProposal = {
  id: string;
  role: string;
  kpiName: string;
  formula: string;
  target: number;
  unit: string;
  weight: number;
  mechanism: string;
  rationale: string;
};

export type AcceptKpiProposalsPayload = {
  proposals: KpiProposal[];
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
