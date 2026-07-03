import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { logTask, computeDockSchedule } from './service';
import { productivityKeys } from './queries';
import type { LogTaskPayload, DockScheduleInput } from './types';

export const logTaskMutation = mutationOptions({
  mutationFn: (data: LogTaskPayload) => logTask(data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: productivityKeys.all })
});

export const computeDockScheduleMutation = mutationOptions({
  mutationFn: (data: DockScheduleInput) => computeDockSchedule(data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: productivityKeys.dockSchedules() })
});
