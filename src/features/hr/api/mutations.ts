import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createWorkflowTask,
  updateWorkflowTask,
  deleteWorkflowTask,
  computeAndSaveStaffingPlan,
  upsertKpiTemplate,
  deleteKpiTemplate,
  acceptKpiProposals
} from './service';
import { hrKeys } from './queries';
import type {
  CreateWorkflowTaskPayload,
  ComputeStaffingPayload,
  UpsertKpiTemplatePayload,
  AcceptKpiProposalsPayload
} from './types';

export const createWorkflowTaskMutation = mutationOptions({
  mutationFn: (data: CreateWorkflowTaskPayload) => createWorkflowTask(data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: hrKeys.workflowTasks() })
});

export const updateWorkflowTaskMutation = mutationOptions({
  mutationFn: ({ id, ...data }: { id: string } & Partial<CreateWorkflowTaskPayload>) =>
    updateWorkflowTask(id, data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: hrKeys.workflowTasks() })
});

export const deleteWorkflowTaskMutation = mutationOptions({
  mutationFn: (id: string) => deleteWorkflowTask(id),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: hrKeys.workflowTasks() })
});

export const computeStaffingPlanMutation = mutationOptions({
  mutationFn: (data: ComputeStaffingPayload) => computeAndSaveStaffingPlan(data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: hrKeys.staffingPlans() })
});

export const upsertKpiTemplateMutation = mutationOptions({
  mutationFn: (data: UpsertKpiTemplatePayload) => upsertKpiTemplate(data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: hrKeys.kpiTemplates() })
});

export const deleteKpiTemplateMutation = mutationOptions({
  mutationFn: (id: string) => deleteKpiTemplate(id),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: hrKeys.kpiTemplates() })
});

export const acceptKpiProposalsMutation = mutationOptions({
  mutationFn: (data: AcceptKpiProposalsPayload) => acceptKpiProposals(data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: hrKeys.kpiTemplates() })
});
