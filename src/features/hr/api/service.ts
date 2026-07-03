'use server';

import { and, asc, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { employees, staffingPlans, workTasks, workflowTasks, kpiTemplates } from '@/db/schema';
import { requireOrgContext } from '@/lib/auth-context';
import { runAonScheduler } from '../utils/aon-scheduler';
import { computeAon } from '../utils/aon';
import type {
  HrKpiMetrics,
  StaffingPlan,
  WorkTask,
  CreatePlanPayload,
  CreateTaskPayload,
  WorkflowTask,
  KpiTemplate,
  CreateWorkflowTaskPayload,
  ComputeStaffingPayload,
  StaffingResult,
  UpsertKpiTemplatePayload
} from './types';

// ─── HR KPI ──────────────────────────────────────────────────────────────────

export async function getHrKpiMetrics(): Promise<HrKpiMetrics> {
  const { orgId } = await requireOrgContext();

  const all = await db
    .select({
      status: employees.status,
      hireDate: employees.hireDate,
      terminationDate: employees.terminationDate
    })
    .from(employees)
    .where(eq(employees.orgId, orgId));

  const active = all.filter((e) => e.status === 'active');
  const terminated = all.filter((e) => e.status === 'terminated' && e.terminationDate);

  // Average tenure: for active = months since hire, for terminated = hire→termination
  const now = new Date();
  const tenures = all.map((e) => {
    const end = e.terminationDate ? new Date(e.terminationDate) : now;
    const start = new Date(e.hireDate);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  });
  const avgTenure = tenures.length > 0 ? tenures.reduce((a, b) => a + b, 0) / tenures.length : 0;

  // Monthly timeline for last 12 months
  const months: HrKpiMetrics['headcountTimeline'] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = d.toISOString().slice(0, 10);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);

    const hired = all.filter((e) => e.hireDate >= monthStart && e.hireDate <= monthEnd).length;
    const term = all.filter(
      (e) => e.terminationDate && e.terminationDate >= monthStart && e.terminationDate <= monthEnd
    ).length;
    months.push({ month: label, hired, terminated: term, net: hired - term });
  }

  // Turnover rate = terminated in last 12 months / avg headcount
  const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().slice(0, 10);
  const terminatedLast12 = all.filter(
    (e) => e.terminationDate && e.terminationDate >= yearAgo
  ).length;
  const avgHeadcount = active.length + terminatedLast12 / 2 || 1;
  const turnoverRate = (terminatedLast12 / avgHeadcount) * 100;

  const roundedTurnoverRate = Math.round(turnoverRate * 10) / 10;

  return {
    totalActive: active.length,
    totalTerminated: terminated.length,
    avgTenureMonths: Math.round(avgTenure * 10) / 10,
    turnoverRate: roundedTurnoverRate,
    turnoverRatePercent: roundedTurnoverRate,
    headcountTimeline: months,
    monthlyTrend: months
  };
}

// ─── Staffing Plans ───────────────────────────────────────────────────────────

export async function listStaffingPlans(): Promise<StaffingPlan[]> {
  const { orgId } = await requireOrgContext();
  return db
    .select()
    .from(staffingPlans)
    .where(eq(staffingPlans.orgId, orgId))
    .orderBy(desc(staffingPlans.createdAt));
}

export async function createStaffingPlan(payload: CreatePlanPayload): Promise<{ id: string }> {
  const { orgId } = await requireOrgContext();
  const [row] = await db
    .insert(staffingPlans)
    .values({ ...payload, orgId })
    .returning({ id: staffingPlans.id });
  return row;
}

export async function deleteStaffingPlan(id: string): Promise<void> {
  const { orgId } = await requireOrgContext();
  await db
    .delete(staffingPlans)
    .where(and(eq(staffingPlans.id, id), eq(staffingPlans.orgId, orgId)));
}

// ─── Work Tasks ───────────────────────────────────────────────────────────────

export async function listWorkflowTasks(): Promise<WorkflowTask[]> {
  const { orgId } = await requireOrgContext();
  return db
    .select()
    .from(workflowTasks)
    .where(eq(workflowTasks.orgId, orgId))
    .orderBy(asc(workflowTasks.sortOrder), asc(workflowTasks.createdAt));
}

export async function createWorkflowTask(
  payload: CreateWorkflowTaskPayload
): Promise<{ id: string }> {
  const { orgId } = await requireOrgContext();
  const [row] = await db
    .insert(workflowTasks)
    .values({
      orgId,
      name: payload.name,
      estimatedMinutes: payload.estimatedMinutes,
      requiredRole: payload.requiredRole ?? null,
      dependencies: payload.dependencies ?? [],
      sortOrder: payload.sortOrder ?? 0
    })
    .returning({ id: workflowTasks.id });
  return row;
}

export async function updateWorkflowTask(
  id: string,
  payload: Partial<CreateWorkflowTaskPayload>
): Promise<void> {
  const { orgId } = await requireOrgContext();
  await db
    .update(workflowTasks)
    .set({ ...payload, updatedAt: new Date() })
    .where(and(eq(workflowTasks.id, id), eq(workflowTasks.orgId, orgId)));
}

export async function deleteWorkflowTask(id: string): Promise<void> {
  const { orgId } = await requireOrgContext();
  await db
    .delete(workflowTasks)
    .where(and(eq(workflowTasks.id, id), eq(workflowTasks.orgId, orgId)));
}

export async function computeAndSaveStaffingPlan(
  payload: ComputeStaffingPayload
): Promise<{ id: string; result: StaffingResult }> {
  const { orgId } = await requireOrgContext();
  const tasks = await listWorkflowTasks();
  const result = computeAon(tasks, payload.dailyVolume, payload.workHoursPerShift);
  const availableHeadcount = Object.values(result.headcountByRole).reduce(
    (total, count) => total + count,
    0
  );
  const [row] = await db
    .insert(staffingPlans)
    .values({
      orgId,
      name: `Staffing ${payload.planDate}`,
      availableHeadcount: Math.max(availableHeadcount, 1),
      criticalPathHours: result.totalDurationMinutes / 60
    })
    .returning({ id: staffingPlans.id });

  return { id: row.id, result };
}

export async function listKpiTemplates(): Promise<KpiTemplate[]> {
  const { orgId } = await requireOrgContext();
  return db
    .select()
    .from(kpiTemplates)
    .where(eq(kpiTemplates.orgId, orgId))
    .orderBy(asc(kpiTemplates.role), asc(kpiTemplates.kpiName));
}

export async function upsertKpiTemplate(
  payload: UpsertKpiTemplatePayload
): Promise<{ id: string }> {
  const { orgId } = await requireOrgContext();
  const values = {
    role: payload.role,
    kpiName: payload.kpiName,
    formula: payload.formula ?? null,
    target: payload.target ?? null,
    unit: payload.unit ?? null,
    weight: payload.weight ?? 1,
    updatedAt: new Date()
  };

  if (payload.id) {
    await db
      .update(kpiTemplates)
      .set(values)
      .where(and(eq(kpiTemplates.id, payload.id), eq(kpiTemplates.orgId, orgId)));
    return { id: payload.id };
  }

  const [row] = await db
    .insert(kpiTemplates)
    .values({ ...values, orgId })
    .returning({ id: kpiTemplates.id });
  return row;
}

export async function deleteKpiTemplate(id: string): Promise<void> {
  const { orgId } = await requireOrgContext();
  await db.delete(kpiTemplates).where(and(eq(kpiTemplates.id, id), eq(kpiTemplates.orgId, orgId)));
}

export async function getWorkTasks(planId: string): Promise<WorkTask[]> {
  const { orgId } = await requireOrgContext();
  return db
    .select()
    .from(workTasks)
    .where(and(eq(workTasks.planId, planId), eq(workTasks.orgId, orgId)))
    .orderBy(asc(workTasks.createdAt));
}

export async function upsertWorkTask(
  payload: CreateTaskPayload & { id?: string }
): Promise<{ id: string }> {
  const { orgId } = await requireOrgContext();
  if (payload.id) {
    await db
      .update(workTasks)
      .set({ ...payload, updatedAt: new Date() })
      .where(and(eq(workTasks.id, payload.id), eq(workTasks.orgId, orgId)));
    return { id: payload.id };
  }
  const [row] = await db
    .insert(workTasks)
    .values({ ...payload, orgId })
    .returning({ id: workTasks.id });
  return row;
}

export async function deleteWorkTask(id: string): Promise<void> {
  const { orgId } = await requireOrgContext();
  await db.delete(workTasks).where(and(eq(workTasks.id, id), eq(workTasks.orgId, orgId)));
}

// Run AON scheduler and persist results back to work_tasks
export async function runAndSavePlan(planId: string): Promise<void> {
  const { orgId } = await requireOrgContext();

  const [plan, tasks] = await Promise.all([
    db
      .select()
      .from(staffingPlans)
      .where(and(eq(staffingPlans.id, planId), eq(staffingPlans.orgId, orgId)))
      .then((r) => r[0]),
    getWorkTasks(planId)
  ]);
  if (!plan) return;

  const result = runAonScheduler(
    tasks.map((t) => ({
      id: t.id,
      name: t.name,
      durationHours: t.durationHours,
      predecessorIds: (t.predecessorIds as string[]) ?? [],
      requiredHeadcount: t.requiredHeadcount,
      color: t.color ?? undefined
    })),
    plan.availableHeadcount
  );

  // Persist computed values back
  await Promise.all([
    ...result.tasks.map((rt) =>
      db
        .update(workTasks)
        .set({
          earlyStart: rt.earlyStart,
          earlyFinish: rt.earlyFinish,
          lateStart: rt.lateStart,
          lateFinish: rt.lateFinish,
          totalFloat: rt.totalFloat,
          isCritical: rt.isCritical ? 1 : 0,
          updatedAt: new Date()
        })
        .where(eq(workTasks.id, rt.id))
    ),
    db
      .update(staffingPlans)
      .set({ criticalPathHours: result.criticalPathHours, updatedAt: new Date() })
      .where(eq(staffingPlans.id, planId))
  ]);
}
