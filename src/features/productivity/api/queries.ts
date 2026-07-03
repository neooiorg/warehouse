import { queryOptions } from '@tanstack/react-query';
import {
  getProductivitySummary,
  getProductivityScores,
  listDockAppointments,
  listDocks
} from './service';

export const productivityKeys = {
  all: ['productivity'] as const,
  summary: (days: number) => [...productivityKeys.all, 'summary', days] as const,
  dockAppointments: (wId: string) => [...productivityKeys.all, 'dock-appointments', wId] as const,
  docks: (wId: string) => [...productivityKeys.all, 'docks', wId] as const,
  dockSchedules: () => [...productivityKeys.all, 'dock-schedules'] as const,
  scores: (warehouseId?: string) =>
    [...productivityKeys.all, 'scores', warehouseId ?? 'all'] as const
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

export const productivityScoresQueryOptions = (warehouseId?: string) =>
  queryOptions({
    queryKey: productivityKeys.scores(warehouseId),
    queryFn: () => getProductivityScores(warehouseId)
  });
export const dockSchedulesQueryOptions = dockAppointmentsOptions;
