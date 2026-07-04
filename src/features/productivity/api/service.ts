'use server';

import { and, count, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  dockAppointments,
  dockSchedules,
  docks,
  employees,
  taskLogs,
  warehouses,
  workflowTasks
} from '@/db/schema';
import { requireOrgContext } from '@/lib/auth-context';
import { scheduleDocks } from '../utils/dock-scheduler';
import type {
  DockAppointmentInput,
  DockScheduleInput,
  DockScheduleResult,
  EmployeeProductivity,
  LogTaskPayload,
  ProductivitySummary,
  TaskLogImportResult,
  TaskLogImportRow
} from './types';

export async function getProductivitySummary(periodDays = 30): Promise<ProductivitySummary> {
  const { orgId } = await requireOrgContext();

  const since = new Date();
  since.setDate(since.getDate() - periodDays);

  const rows = await db
    .select({
      employeeId: taskLogs.employeeId,
      transactionCount: count(),
      totalQty: sql<number>`coalesce(sum(${taskLogs.qty}), 0)`,
      totalHours: sql<number>`coalesce(sum(greatest(extract(epoch from coalesce(${taskLogs.completedAt}, now()) - ${taskLogs.startedAt}) / 3600.0, 0.25)), 0)`
    })
    .from(taskLogs)
    .where(and(eq(taskLogs.orgId, orgId), gte(taskLogs.startedAt, since)))
    .groupBy(taskLogs.employeeId);

  if (rows.length === 0) {
    return { employees: [], periodDays, topPerformer: null };
  }

  const employeeRows = await db
    .select({ id: employees.id, fullName: employees.fullName, role: employees.role })
    .from(employees)
    .where(eq(employees.orgId, orgId));
  const employeeMap = new Map(employeeRows.map((employee) => [employee.id, employee]));

  const result = rows
    .filter((row) => row.employeeId)
    .map((row) => {
      const employee = employeeMap.get(row.employeeId!);
      const totalQty = Number(row.totalQty);
      const totalHours = Math.max(Number(row.totalHours), 0.25);
      const qtyPerHour = Math.round((totalQty / totalHours) * 10) / 10;

      return {
        employeeId: row.employeeId!,
        employeeName: employee?.fullName ?? 'Khong ro',
        role: employee?.role ?? null,
        transactionCount: row.transactionCount,
        tasksCompleted: row.transactionCount,
        totalPallets: totalQty,
        totalQty,
        avgDailyPallets: Math.round((totalQty / periodDays) * 10) / 10,
        qtyPerHour,
        normalizedScore: 100,
        standardRatePerHour: qtyPerHour,
        productivityRatePercent: 100,
        rankScore: row.transactionCount + totalQty * 0.5
      } satisfies EmployeeProductivity;
    })
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
    .select({
      employeeId: taskLogs.employeeId,
      taskTypeId: taskLogs.taskTypeId,
      qty: taskLogs.qty,
      startedAt: taskLogs.startedAt,
      completedAt: taskLogs.completedAt
    })
    .from(taskLogs)
    .where(
      and(
        eq(taskLogs.orgId, orgId),
        warehouseId ? eq(taskLogs.warehouseId, warehouseId) : undefined
      )
    );

  if (rows.length === 0) return [];

  const taskTypeIds = [...new Set(rows.map((row) => row.taskTypeId).filter(Boolean))] as string[];

  const [employeeRows, taskRows] = await Promise.all([
    db
      .select({ id: employees.id, fullName: employees.fullName, role: employees.role })
      .from(employees)
      .where(eq(employees.orgId, orgId)),
    taskTypeIds.length > 0
      ? db
          .select({
            id: workflowTasks.id,
            outputUnit: workflowTasks.outputUnit,
            standardRatePerHour: workflowTasks.standardRatePerHour
          })
          .from(workflowTasks)
          .where(and(eq(workflowTasks.orgId, orgId), inArray(workflowTasks.id, taskTypeIds)))
      : Promise.resolve([])
  ]);

  const employeeMap = new Map(employeeRows.map((employee) => [employee.id, employee]));
  const taskMap = new Map(taskRows.map((task) => [task.id, task]));
  const grouped = new Map<string, EmployeeProductivity>();

  for (const row of rows) {
    if (!row.employeeId) continue;

    const employee = employeeMap.get(row.employeeId);
    const workflowTask = row.taskTypeId ? taskMap.get(row.taskTypeId) : null;
    const standardRatePerHour = workflowTask?.standardRatePerHour ?? 1;
    const completedAt = row.completedAt ? new Date(row.completedAt) : new Date();
    const startedAt = new Date(row.startedAt);
    const hours = Math.max((completedAt.getTime() - startedAt.getTime()) / 36e5, 0.25);
    const qty = Number(row.qty);
    const qtyPerHour = qty / hours;
    const productivityRatePercent = Math.round((qtyPerHour / standardRatePerHour) * 100);

    const current =
      grouped.get(row.employeeId) ??
      ({
        employeeId: row.employeeId,
        employeeName: employee?.fullName ?? 'Khong ro',
        role: employee?.role ?? null,
        transactionCount: 0,
        tasksCompleted: 0,
        totalPallets: 0,
        totalQty: 0,
        avgDailyPallets: 0,
        qtyPerHour: 0,
        normalizedScore: 0,
        standardRatePerHour: 0,
        productivityRatePercent: 0,
        rankScore: 0
      } satisfies EmployeeProductivity);

    current.transactionCount += 1;
    current.tasksCompleted += 1;
    current.totalPallets += qty;
    current.totalQty += qty;
    current.qtyPerHour += qtyPerHour;
    current.standardRatePerHour += standardRatePerHour;
    current.productivityRatePercent += productivityRatePercent;
    current.normalizedScore += Math.max(productivityRatePercent, 0);
    current.rankScore = current.tasksCompleted + current.normalizedScore * 0.1;
    grouped.set(row.employeeId, current);
  }

  return [...grouped.values()]
    .map((row) => ({
      ...row,
      avgDailyPallets: row.totalQty,
      qtyPerHour: Math.round((row.qtyPerHour / Math.max(row.tasksCompleted, 1)) * 10) / 10,
      standardRatePerHour:
        Math.round((row.standardRatePerHour / Math.max(row.tasksCompleted, 1)) * 10) / 10,
      productivityRatePercent: Math.round(
        row.productivityRatePercent / Math.max(row.tasksCompleted, 1)
      ),
      normalizedScore: Math.round(row.normalizedScore / Math.max(row.tasksCompleted, 1))
    }))
    .sort((a, b) => b.rankScore - a.rankScore);
}

export async function logTask(payload: LogTaskPayload) {
  const { orgId } = await requireOrgContext();
  const [taskType] = await db
    .select({
      id: workflowTasks.id,
      outputUnit: workflowTasks.outputUnit
    })
    .from(workflowTasks)
    .where(and(eq(workflowTasks.orgId, orgId), eq(workflowTasks.id, payload.taskTypeId)))
    .limit(1);

  if (!taskType) {
    throw new Error('Khong tim thay dau viec trong quy trinh');
  }

  const [row] = await db
    .insert(taskLogs)
    .values({
      orgId,
      warehouseId: payload.warehouseId || null,
      employeeId: payload.employeeId,
      taskTypeId: payload.taskTypeId,
      startedAt: new Date(payload.startedAt),
      completedAt: payload.completedAt ? new Date(payload.completedAt) : null,
      qty: payload.qty,
      unit: payload.unit ?? taskType.outputUnit,
      note: payload.note ?? null
    })
    .returning({ id: taskLogs.id });
  return row;
}

export async function importTaskLogs(rows: TaskLogImportRow[]): Promise<TaskLogImportResult> {
  const { orgId } = await requireOrgContext();
  const errors: TaskLogImportResult['errors'] = [];

  if (rows.length === 0) {
    return { importedCount: 0, errors: [{ line: 1, message: 'File khong co du lieu.' }] };
  }

  const [employeeRows, taskRows, warehouseRows] = await Promise.all([
    db.select().from(employees).where(eq(employees.orgId, orgId)),
    db.select().from(workflowTasks).where(eq(workflowTasks.orgId, orgId)),
    db.select().from(warehouses).where(eq(warehouses.orgId, orgId))
  ]);

  const employeeMap = new Map(employeeRows.map((row) => [row.fullName.trim().toLowerCase(), row]));
  const taskMap = new Map(taskRows.map((row) => [row.name.trim().toLowerCase(), row]));
  const warehouseMap = new Map(warehouseRows.map((row) => [row.code.trim().toLowerCase(), row]));
  const inserts: Array<typeof taskLogs.$inferInsert> = [];

  for (const row of rows) {
    const employee = employeeMap.get(row.employeeName.trim().toLowerCase());
    const task = taskMap.get(row.taskName.trim().toLowerCase());
    const warehouse = row.warehouseCode
      ? warehouseMap.get(row.warehouseCode.trim().toLowerCase())
      : null;

    if (!employee) {
      errors.push({ line: row.line, message: `Khong tim thay nhan vien "${row.employeeName}".` });
      continue;
    }
    if (!task) {
      errors.push({ line: row.line, message: `Khong tim thay dau viec "${row.taskName}".` });
      continue;
    }
    if (row.warehouseCode && !warehouse) {
      errors.push({ line: row.line, message: `Khong tim thay kho "${row.warehouseCode}".` });
      continue;
    }
    if (!row.startedAt || !row.completedAt) {
      errors.push({ line: row.line, message: 'Thieu startedAt hoac completedAt.' });
      continue;
    }
    if (!(row.qty > 0)) {
      errors.push({ line: row.line, message: 'So luong phai lon hon 0.' });
      continue;
    }

    inserts.push({
      orgId,
      warehouseId: warehouse?.id ?? null,
      employeeId: employee.id,
      taskTypeId: task.id,
      startedAt: new Date(row.startedAt),
      completedAt: new Date(row.completedAt),
      qty: row.qty,
      unit: row.unit ?? task.outputUnit,
      note: row.note ?? null
    });
  }

  if (errors.length > 0) {
    return { importedCount: 0, errors };
  }

  await db.insert(taskLogs).values(inserts);
  return { importedCount: inserts.length, errors: [] };
}

export async function computeDockSchedule(data: DockScheduleInput): Promise<DockScheduleResult> {
  const { orgId } = await requireOrgContext();
  const dockRows = await listDocks(data.warehouseId);
  const scheduled = scheduleDocks(
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
      resultJson: scheduled
    })
    .returning({ id: dockSchedules.id });

  return {
    id: row.id,
    assignments: scheduled.assignments,
    docks: dockRows
      .map((dock) => ({ id: dock.id, code: dock.code }))
      .sort((a, b) => a.code.localeCompare(b.code)),
    avgWaitMinutes: scheduled.avgWaitMinutes,
    totalCompletionMinutes: scheduled.totalCompletionMinutes,
    utilizationByDock: scheduled.utilizationByDock,
    overloadWarnings: scheduled.overloadWarnings
  };
}
