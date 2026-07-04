import { describe, expect, test } from 'bun:test';
import { runAonScheduler } from './aon-scheduler';

describe('runAonScheduler', () => {
  test('computes critical path and float', () => {
    const result = runAonScheduler(
      [
        { id: 'a', name: 'A', durationHours: 2, predecessorIds: [], requiredHeadcount: 1 },
        { id: 'b', name: 'B', durationHours: 1, predecessorIds: ['a'], requiredHeadcount: 1 },
        { id: 'c', name: 'C', durationHours: 1, predecessorIds: ['a'], requiredHeadcount: 1 }
      ],
      2
    );
    expect(result.criticalPathHours).toBe(3);
    expect(result.tasks.find((task) => task.id === 'a')?.isCritical).toBeTrue();
  });

  test('resource levels when headcount is insufficient', () => {
    const result = runAonScheduler(
      [
        { id: 'a', name: 'A', durationHours: 2, predecessorIds: [], requiredHeadcount: 2 },
        { id: 'b', name: 'B', durationHours: 2, predecessorIds: [], requiredHeadcount: 2 }
      ],
      2
    );
    const a = result.tasks.find((task) => task.id === 'a')!;
    const b = result.tasks.find((task) => task.id === 'b')!;
    expect(a.scheduledEnd <= b.scheduledStart || b.scheduledEnd <= a.scheduledStart).toBeTrue();
    expect(result.totalDurationHours).toBe(4);
  });
});
