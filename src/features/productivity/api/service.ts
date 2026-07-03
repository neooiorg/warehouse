'use server';

import { and, count, eq, gte, isNotNull, sql, sum } from 'drizzle-orm';
import { db } from '@/db';
import { employees, inventoryTransactions, dockAppointments, docks } from '@/db/schema';
import { requireOrgContext } from '@/lib/auth-context';
import type { ProductivitySummary, DockAppointmentInput } from './types';

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
    .select({ id: employees.id, fullName: employees.fullName })
    .from(employees)
    .where(and(eq(employees.orgId, orgId)));

  const empMap = Object.fromEntries(empRows.map((e) => [e.id, e.fullName]));

  const result = rows
    .filter((r) => r.employeeId)
    .map((r) => ({
      employeeId: r.employeeId!,
      employeeName: empMap[r.employeeId!] ?? 'Unknown',
      transactionCount: r.transactionCount,
      totalPallets: Number(r.totalPallets),
      avgDailyPallets: Math.round((Number(r.totalPallets) / periodDays) * 10) / 10,
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

export async function logTask(payload: Record<string, unknown>) {
  return createDockAppointment(payload as DockAppointmentInput);
}

export async function computeDockSchedule(data: Record<string, unknown>) {
  return createDockAppointment(data as DockAppointmentInput);
}
