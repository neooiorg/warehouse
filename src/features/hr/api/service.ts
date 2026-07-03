'use server';

import { and, eq, desc, asc, count, sql, gte, lte, isNotNull } from 'drizzle-orm';
import { db } from '@/db';
import { employees, workflowTasks, staffingPlans, kpiTemplates } from '@/db/schema';
import { requireOrgContext } from '@/lib/auth-context';
import { computeAon } from '../utils/aon';
import type {
  EmployeeFilters,
  TurnoverMetrics,
  CreateWorkflowTaskPayload,
  ComputeStaffingPayload,
  UpsertKpiTemplatePayload
} from './types';

export async function getEmployees(filters: EmployeeFilters = {}) {
  const { orgId } = await requireOrgContext();
  const { page = 1, limit = 20 } = filters;
  const conditions = [eq(employees.orgId, orgId)];
  if (filters.warehouseId) conditions.push(eq(employees.warehouseId, filters.warehouseId));
  if (filters.status) conditions.push(eq(employees.status, filters.status));
  if (filters.role) conditions.push(eq(employees.role, filters.role));

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(employees)
      .where(and(...conditions))
      .orderBy(desc(employees.hireDate))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(employees).where(and(...conditions))
  ]);

  return { data: rows, total, page, limit, pageCount: Math.ceil(total / limit) };
}

export async function getTurnoverMetrics(warehouseId?: string): Promise<TurnoverMetrics> {
  const { orgId } = await requireOrgContext();
  const base = [eq(employees.orgId, orgId)];
  if (warehouseId) base.push(eq(employees.warehouseId, warehouseId));

  const all = await db.select().from(employees).where(and(...base));

  const now = new Date();
  const totalActive = all.filter((e) => e.status === 'active').length;
  const totalTerminated = all.filter((e) => e.status === 'terminated').length;
  const turnoverRate = all.length > 0 ? (totalTerminated / all.length) * 100 : 0;

  const tenures = all
    .filter((e) => e.hireDate)
    .map((e) => {
      const end = e.terminationDate ? new Date(e.terminationDate) : now;
      return (end.getTime() - new Date(e.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
    });
  const avgTenureMonths = tenures.length > 0 ? tenures.reduce((a, b) => a + b, 0) / tenures.length : 0;

  // Monthly trend (last 12 months)
  const monthlyTrend: { month: string; hired: number; terminated: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const hired = all.filter((e) => e.hireDate?.startsWith(monthStr)).length;
    const terminated = all.filter((e) => e.terminationDate?.startsWith(monthStr)).length;
    monthlyTrend.push({ month: monthStr, hired, terminated });
  }

  return { totalActive, totalTerminated, turnoverRate, avgTenureMonths, monthlyTrend };
}

export async function getWorkflowTasks() {
  const { orgId } = await requireOrgContext();
  return db
    .select()
    .from(workflowTasks)
    .where(eq(workflowTasks.orgId, orgId))
    .orderBy(asc(workflowTasks.sortOrder));
}

export async function createWorkflowTask(payload: CreateWorkflowTaskPayload) {
  const { orgId } = await requireOrgContext();
  const [row] = await db
    .insert(workflowTasks)
    .values({ ...payload, orgId, dependencies: payload.dependencies ?? [] })
    .returning();
  return row;
}

export async function updateWorkflowTask(id: string, payload: Partial<CreateWorkflowTaskPayload>) {
  const { orgId } = await requireOrgContext();
  const [row] = await db
    .update(workflowTasks)
    .set(payload)
    .where(and(eq(workflowTasks.id, id), eq(workflowTasks.orgId, orgId)))
    .returning();
  return row;
}

export async function deleteWorkflowTask(id: string) {
  const { orgId } = await requireOrgContext();
  await db.delete(workflowTasks).where(and(eq(workflowTasks.id, id), eq(workflowTasks.orgId, orgId)));
}

export async function computeAndSaveStaffingPlan(payload: ComputeStaffingPayload) {
  const { orgId } = await requireOrgContext();
  const tasks = await db
    .select()
    .from(workflowTasks)
    .where(eq(workflowTasks.orgId, orgId))
    .orderBy(asc(workflowTasks.sortOrder));

  const result = computeAon(tasks, payload.dailyVolume, payload.workHoursPerShift);

  const [plan] = await db
    .insert(staffingPlans)
    .values({
      orgId,
      warehouseId: payload.warehouseId ?? null,
      planDate: payload.planDate,
      dailyVolume: payload.dailyVolume,
      workHoursPerShift: payload.workHoursPerShift,
      inputJson: tasks,
      resultJson: result
    })
    .returning();

  return { plan, result };
}

export async function getStaffingPlans(warehouseId?: string) {
  const { orgId } = await requireOrgContext();
  const conditions = [eq(staffingPlans.orgId, orgId)];
  if (warehouseId) conditions.push(eq(staffingPlans.warehouseId, warehouseId));
  return db
    .select()
    .from(staffingPlans)
    .where(and(...conditions))
    .orderBy(desc(staffingPlans.planDate));
}

export async function getKpiTemplates(role?: string) {
  const { orgId } = await requireOrgContext();
  const conditions = [eq(kpiTemplates.orgId, orgId)];
  if (role) conditions.push(eq(kpiTemplates.role, role));
  return db.select().from(kpiTemplates).where(and(...conditions)).orderBy(asc(kpiTemplates.role));
}

export async function upsertKpiTemplate(payload: UpsertKpiTemplatePayload) {
  const { orgId } = await requireOrgContext();
  if (payload.id) {
    const [row] = await db
      .update(kpiTemplates)
      .set({ ...payload })
      .where(and(eq(kpiTemplates.id, payload.id), eq(kpiTemplates.orgId, orgId)))
      .returning();
    return row;
  }
  const [row] = await db
    .insert(kpiTemplates)
    .values({ ...payload, orgId })
    .returning();
  return row;
}

export async function deleteKpiTemplate(id: string) {
  const { orgId } = await requireOrgContext();
  await db.delete(kpiTemplates).where(and(eq(kpiTemplates.id, id), eq(kpiTemplates.orgId, orgId)));
}
