'use server';

import { and, count, eq, gte, isNotNull, sql, sum } from 'drizzle-orm';
import { db } from '@/db';
import {
  employees,
  inventoryTransactions,
  dockAppointments,
  docks,
  taskLogs,
  dockSchedules
} from '@/db/schema';
import { requireOrgContext } from '@/lib/auth-context';
import { scheduleDocks } from '../utils/dock-scheduler';
import type {
  ProductivitySummary,
  DockAppointmentInput,
  LogTaskPayload,
  DockScheduleInput,
  DockScheduleResult,
  EmployeeProductivity
} from './types';

export async function getProductivitySummary(periodDays = 30): Promise<ProductivitySummary> {
  const { orgId } = await requireOrgContext();

  const since = new Date();
  since.setDate(since.getDate() - periodDays);

  const rows = await db
    .select({
      employeeId: inventoryTransactions.performedBy,
      transactionCount: count(),
      totalPallets: sql<number>`coalesce(sum(${inventoryTransactions.qty}), 0)`
    })
    .from(inventoryTransactions)
    .where(
      and(
        eq(inventoryTransactions.orgId, orgId),
        isNotNull(inventoryTransactions.performedBy),
        gte(inventoryTransactions.occurredAt, since)
      )
    )
    .groupBy(inventoryTransactions.performedBy);

  if (rows.length === 0) {
    return { employees: [], periodDays, topPerformer: null };
  }

  const employeeIds = rows.map((r) => r.employeeId!);
  const empRows = await db
    .select({ id: employees.id, fullName: employees.fullName, role: employees.role })
    .from(employees)
    .where(and(eq(employees.orgId, orgId)));

  const empMap = Object.fromEntries(empRows.map((e) => [e.id, e.fullName]));

  const result = rows
    .filter((r) => r.employeeId)
    .map((r) => ({
      employeeId: r.employeeId!,
      employeeName: empMap[r.employeeId!] ?? 'Không rõ',
      role: null,
      transactionCount: r.transactionCount,
      tasksCompleted: r.transactionCount,
      totalPallets: Number(r.totalPallets),
      totalQty: Number(r.totalPallets),
      avgDailyPallets: Math.round((Number(r.totalPallets) / periodDays) * 10) / 10,
      qtyPerHour: Math.round((Number(r.totalPallets) / Math.max(periodDays * 8, 1)) * 10) / 10,
      rankScore: r.transactionCount * 1 + Number(r.totalPallets) * 0.5
    }))
    .sort((a, b) => b.rankScore - a.rankScore);

  return {
    employees: result,
    periodDays,
    topPerformer: result[0]?.employeeName ?? null
  };
}

export async function listDockAppointments(warehouseId: string) {
  const { orgId } = await requireOrgContext();
  return db
    .select()
    .from(dockAppointments)
    .where(and(eq(dockAppointments.orgId, orgId), eq(dockAppointments.warehouseId, warehouseId)));
}

export async function createDockAppointment(input: DockAppointmentInput) {
  const { orgId } = await requireOrgContext();
  const [row] = await db
    .insert(dockAppointments)
    .values({ ...input, orgId })
    .returning({ id: dockAppointments.id });
  return row;
}

export async function listDocks(warehouseId: string) {
  const { orgId } = await requireOrgContext();
  return db
    .select()
    .from(docks)
    .where(and(eq(docks.orgId, orgId), eq(docks.warehouseId, warehouseId)));
}

export async function getProductivityScores(warehouseId?: string): Promise<EmployeeProductivity[]> {
  const { orgId } = await requireOrgContext();
  const rows = await db
    .select()
    .from(taskLogs)
    .where(
      and(
        eq(taskLogs.orgId, orgId),
        warehouseId ? eq(taskLogs.warehouseId, warehouseId) : undefined
      )
    );

  if (rows.length === 0) return [];

  const empRows = await db
    .select({ id: employees.id, fullName: employees.fullName, role: employees.role })
    .from(employees)
    .where(eq(employees.orgId, orgId));
  const empMap = new Map(empRows.map((employee) => [employee.id, employee]));
  const grouped = new Map<string, EmployeeProductivity>();

  for (const row of rows) {
    if (!row.employeeId) continue;
    const employee = empMap.get(row.employeeId);
    const current =
      grouped.get(row.employeeId) ??
      ({
        employeeId: row.employeeId,
        employeeName: employee?.fullName ?? 'Không rõ',
        role: employee?.role ?? null,
        transactionCount: 0,
        tasksCompleted: 0,
        totalPallets: 0,
        totalQty: 0,
        avgDailyPallets: 0,
        qtyPerHour: 0,
        rankScore: 0
      } satisfies EmployeeProductivity);

    const completedAt = row.completedAt ? new Date(row.completedAt) : new Date();
    const startedAt = new Date(row.startedAt);
    const hours = Math.max((completedAt.getTime() - startedAt.getTime()) / 36e5, 0.25);

    current.transactionCount += 1;
    current.tasksCompleted += 1;
    current.totalPallets += Number(row.qty);
    current.totalQty += Number(row.qty);
    current.qtyPerHour += Number(row.qty) / hours;
    current.rankScore = current.tasksCompleted + current.totalQty * 0.5;
    grouped.set(row.employeeId, current);
  }

  return [...grouped.values()]
    .map((row) => ({
      ...row,
      avgDailyPallets: row.totalQty,
      qtyPerHour: Math.round(row.qtyPerHour * 10) / 10
    }))
    .sort((a, b) => b.rankScore - a.rankScore);
}

export async function logTask(payload: LogTaskPayload) {
  const { orgId } = await requireOrgContext();
  const [row] = await db
    .insert(taskLogs)
    .values({
      orgId,
      warehouseId: payload.warehouseId || null,
      employeeId: payload.employeeId,
      taskTypeId: payload.taskTypeId || null,
      startedAt: new Date(payload.startedAt),
      completedAt: payload.completedAt ? new Date(payload.completedAt) : null,
      qty: payload.qty,
      unit: payload.unit ?? null,
      note: payload.note ?? null
    })
    .returning({ id: taskLogs.id });
  return row;
}

export async function computeDockSchedule(data: DockScheduleInput): Promise<DockScheduleResult> {
  const { orgId } = await requireOrgContext();
  const dockRows = await listDocks(data.warehouseId);
  const assignments = scheduleDocks(
    dockRows.map((dock) => ({ id: dock.id, code: dock.code, direction: dock.direction })),
    data.vehicles,
    data.forkliftsCount,
    data.minutesPerPallet
  );
  const [row] = await db
    .insert(dockSchedules)
    .values({
      orgId,
      warehouseId: data.warehouseId,
      scheduleDate: data.scheduleDate,
      forkliftsCount: data.forkliftsCount,
      minutesPerPallet: data.minutesPerPallet,
      inputJson: data.vehicles,
      resultJson: assignments
    })
    .returning({ id: dockSchedules.id });

  return {
    id: row.id,
    assignments,
    docks: dockRows.map((dock) => ({ id: dock.id, code: dock.code }))
  };
}
