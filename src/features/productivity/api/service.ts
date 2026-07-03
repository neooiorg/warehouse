'use server';

import { and, eq, desc, asc, count, sql, gte, lte } from 'drizzle-orm';
import { db } from '@/db';
import { taskLogs, dockSchedules, employees, warehouses, docks } from '@/db/schema';
import { requireOrgContext } from '@/lib/auth-context';
import { scheduleDocks } from '../utils/dock-scheduler';
import type { TaskLogFilters, LogTaskPayload, DockScheduleInput, ProductivityScore } from './types';

export async function getTaskLogs(filters: TaskLogFilters = {}) {
  const { orgId } = await requireOrgContext();
  const { page = 1, limit = 20 } = filters;
  const conditions = [eq(taskLogs.orgId, orgId)];
  if (filters.warehouseId) conditions.push(eq(taskLogs.warehouseId, filters.warehouseId));
  if (filters.employeeId) conditions.push(eq(taskLogs.employeeId, filters.employeeId));

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(taskLogs).where(and(...conditions)).orderBy(desc(taskLogs.startedAt)).limit(limit).offset((page - 1) * limit),
    db.select({ total: count() }).from(taskLogs).where(and(...conditions))
  ]);
  return { data: rows, total, page, limit, pageCount: Math.ceil(total / limit) };
}

export async function logTask(payload: LogTaskPayload) {
  const { orgId } = await requireOrgContext();
  const [row] = await db.insert(taskLogs).values({
    ...payload,
    orgId,
    startedAt: new Date(payload.startedAt),
    completedAt: payload.completedAt ? new Date(payload.completedAt) : undefined
  }).returning();
  return row;
}

export async function getProductivityScores(warehouseId?: string, dateFrom?: string, dateTo?: string): Promise<ProductivityScore[]> {
  const { orgId } = await requireOrgContext();
  const conditions = [eq(taskLogs.orgId, orgId)];
  if (warehouseId) conditions.push(eq(taskLogs.warehouseId, warehouseId));

  const logs = await db
    .select({
      employeeId: taskLogs.employeeId,
      qty: taskLogs.qty,
      startedAt: taskLogs.startedAt,
      completedAt: taskLogs.completedAt
    })
    .from(taskLogs)
    .where(and(...conditions));

  const empList = await db
    .select({ id: employees.id, fullName: employees.fullName, role: employees.role })
    .from(employees)
    .where(eq(employees.orgId, orgId));

  const empMap = new Map(empList.map((e) => [e.id, e]));
  const grouped = new Map<string, { qty: number; minutes: number; tasks: number }>();

  for (const log of logs) {
    if (!log.employeeId) continue;
    const durationMin = log.completedAt && log.startedAt
      ? (new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 60000
      : 0;
    const cur = grouped.get(log.employeeId) ?? { qty: 0, minutes: 0, tasks: 0 };
    grouped.set(log.employeeId, { qty: cur.qty + (log.qty ?? 0), minutes: cur.minutes + durationMin, tasks: cur.tasks + 1 });
  }

  return [...grouped.entries()].map(([employeeId, stats]) => {
    const emp = empMap.get(employeeId);
    return {
      employeeId,
      employeeName: emp?.fullName ?? 'Unknown',
      role: emp?.role ?? null,
      tasksCompleted: stats.tasks,
      totalQty: stats.qty,
      totalMinutes: stats.minutes,
      qtyPerHour: stats.minutes > 0 ? (stats.qty / stats.minutes) * 60 : 0
    };
  }).sort((a, b) => b.qtyPerHour - a.qtyPerHour);
}

export async function computeDockSchedule(input: DockScheduleInput) {
  const { orgId } = await requireOrgContext();

  const dockRows = await db
    .select({ id: docks.id, code: docks.code, direction: docks.direction })
    .from(docks)
    .where(and(eq(docks.orgId, orgId), eq(docks.warehouseId, input.warehouseId)));

  const assignments = scheduleDocks(dockRows, input.vehicles, input.forkliftsCount, input.minutesPerPallet);

  const [saved] = await db
    .insert(dockSchedules)
    .values({
      orgId,
      warehouseId: input.warehouseId,
      scheduleDate: input.scheduleDate,
      forkliftsCount: input.forkliftsCount,
      minutesPerPallet: input.minutesPerPallet,
      inputJson: input.vehicles,
      resultJson: assignments
    })
    .returning();

  return { schedule: saved, assignments, docks: dockRows };
}

export async function getDockSchedules(warehouseId?: string) {
  const { orgId } = await requireOrgContext();
  const conditions = [eq(dockSchedules.orgId, orgId)];
  if (warehouseId) conditions.push(eq(dockSchedules.warehouseId, warehouseId));
  return db.select().from(dockSchedules).where(and(...conditions)).orderBy(desc(dockSchedules.scheduleDate));
}
