import { queryOptions } from '@tanstack/react-query';
import { getProductivitySummary, listDockAppointments, listDocks } from './service';

export const productivityKeys = {
  all: ['productivity'] as const,
  summary: (days: number) => [...productivityKeys.all, 'summary', days] as const,
  dockAppointments: (wId: string) => [...productivityKeys.all, 'dock-appointments', wId] as const,
  docks: (wId: string) => [...productivityKeys.all, 'docks', wId] as const
};

export const productivitySummaryOptions = (periodDays = 30) =>
  queryOptions({
    queryKey: productivityKeys.summary(periodDays),
    queryFn: () => getProductivitySummary(periodDays)
  });

export const dockAppointmentsOptions = (warehouseId: string) =>
  queryOptions({
    queryKey: productivityKeys.dockAppointments(warehouseId),
    queryFn: () => listDockAppointments(warehouseId)
  });

export const docksOptions = (warehouseId: string) =>
  queryOptions({
    queryKey: productivityKeys.docks(warehouseId),
    queryFn: () => listDocks(warehouseId)
  });
