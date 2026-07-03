import type { staffingPlans, workTasks, employees } from '@/db/schema';

export type StaffingPlan = typeof staffingPlans.$inferSelect;
export type WorkTask = typeof workTasks.$inferSelect;
export type Employee = typeof employees.$inferSelect;

export type HrKpiMetrics = {
  totalActive: number;
  totalTerminated: number;
  avgTenureMonths: number;
  turnoverRatePercent: number;
  headcountTimeline: Array<{ month: string; hired: number; terminated: number; net: number }>;
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
