import { describe, expect, test } from 'bun:test';
import { computeAon } from './aon';
import type { WorkflowTask } from '../api/types';

const tasks: WorkflowTask[] = [
  {
    id: 'receive',
    orgId: 'org',
    name: 'Receive',
    estimatedMinutes: 30,
    requiredRole: 'Dock',
    outputUnit: 'trip',
    standardRatePerHour: 3,
    kpiCategory: 'dock',
    dependencies: [],
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'putaway',
    orgId: 'org',
    name: 'Putaway',
    estimatedMinutes: 45,
    requiredRole: 'Forklift',
    outputUnit: 'pallet',
    standardRatePerHour: 14,
    kpiCategory: 'throughput',
    dependencies: ['receive'],
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('computeAon', () => {
  test('computes critical path and headcount by role', () => {
    const result = computeAon(tasks, 10, 8);
    expect(result.criticalPath).toEqual(['receive', 'putaway']);
    expect(result.totalDurationMinutes).toBe(75);
    expect(result.headcountByRole.Dock).toBe(1);
    expect(result.headcountByRole.Forklift).toBe(1);
  });

  test('scales headcount with volume', () => {
    const result = computeAon(tasks, 100, 8);
    expect(result.headcountByRole.Dock).toBeGreaterThan(1);
    expect(result.headcountByRole.Forklift).toBeGreaterThan(result.headcountByRole.Dock);
  });
});
