import { describe, expect, test } from 'bun:test';
import { scheduleDocks } from './dock-scheduler';

describe('scheduleDocks', () => {
  test('assigns by compatible dock and exposes wait/utilization data', () => {
    const result = scheduleDocks(
      [
        { id: 'd1', code: 'D01', direction: 'inbound' },
        { id: 'd2', code: 'D02', direction: 'both' }
      ],
      [
        { plateNumber: '51A', arrivalTime: '08:00', palletCount: 12, direction: 'inbound' },
        { plateNumber: '51B', arrivalTime: '08:05', palletCount: 12, direction: 'outbound' }
      ],
      1,
      5
    );
    expect(result.assignments).toHaveLength(2);
    expect(result.assignments[1]?.dockCode).toBe('D02');
    expect(result.totalCompletionMinutes).toBeGreaterThan(0);
  });

  test('flags overload when wait grows', () => {
    const result = scheduleDocks(
      [{ id: 'd1', code: 'D01', direction: 'both' }],
      [
        { plateNumber: '51A', arrivalTime: '08:00', palletCount: 20, direction: 'inbound' },
        { plateNumber: '51B', arrivalTime: '08:10', palletCount: 20, direction: 'outbound' }
      ],
      1,
      5
    );
    expect(result.overloadWarnings.length).toBeGreaterThan(0);
    expect(result.avgWaitMinutes).toBeGreaterThan(0);
  });
});
