import { queryOptions } from '@tanstack/react-query';
import { getTaskLogs, getProductivityScores, getDockSchedules } from './service';
import type { TaskLogFilters } from './types';

export const productivityKeys = {
  all: ['productivity'] as const,
  taskLogs: (filters: TaskLogFilters) => [...productivityKeys.all, 'task-logs', filters] as const,
  scores: (warehouseId?: string, dateFrom?: string, dateTo?: string) =>
    [...productivityKeys.all, 'scores', warehouseId, dateFrom, dateTo] as const,
  dockSchedules: (warehouseId?: string) => [...productivityKeys.all, 'dock-schedules', warehouseId] as const
};

export const taskLogsQueryOptions = (filters: TaskLogFilters) =>
  queryOptions({ queryKey: productivityKeys.taskLogs(filters), queryFn: () => getTaskLogs(filters) });

export const productivityScoresQueryOptions = (warehouseId?: string, dateFrom?: string, dateTo?: string) =>
  queryOptions({
    queryKey: productivityKeys.scores(warehouseId, dateFrom, dateTo),
    queryFn: () => getProductivityScores(warehouseId, dateFrom, dateTo)
  });

export const dockSchedulesQueryOptions = (warehouseId?: string) =>
  queryOptions({ queryKey: productivityKeys.dockSchedules(warehouseId), queryFn: () => getDockSchedules(warehouseId) });
