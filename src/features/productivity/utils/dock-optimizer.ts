// Greedy earliest-deadline-first dock scheduling optimizer

export type VehicleRequest = {
  id: string;
  vehicleId?: string;
  palletCount: number;
  arrivalTime: number; // hours from shift start
  deadline?: number; // latest acceptable start (hours)
  direction: 'inbound' | 'outbound';
};

export type DockSlot = {
  dockId: string;
  vehicleRequestId: string;
  startTime: number;
  endTime: number;
  waitTime: number; // arrivalTime → startTime delay
};

export type OptimizationResult = {
  schedule: DockSlot[];
  avgWaitTime: number;
  totalProcessingHours: number;
  utilization: Record<string, number>; // dockId → utilization %
};

export function optimizeDockSchedule(
  vehicles: VehicleRequest[],
  dockIds: string[],
  avgMinutesPerPallet: number,
  shiftDurationHours = 8
): OptimizationResult {
  if (dockIds.length === 0 || vehicles.length === 0) {
    return { schedule: [], avgWaitTime: 0, totalProcessingHours: 0, utilization: {} };
  }

  const minPerPallet = avgMinutesPerPallet / 60; // convert to hours

  // Sort by deadline (EDF), then arrival time
  const sorted = [...vehicles].sort((a, b) => {
    const da = a.deadline ?? Infinity;
    const db = b.deadline ?? Infinity;
    if (da !== db) return da - db;
    return a.arrivalTime - b.arrivalTime;
  });

  // Track next free time per dock
  const dockFreeAt: Record<string, number> = Object.fromEntries(dockIds.map((d) => [d, 0]));
  const schedule: DockSlot[] = [];

  for (const v of sorted) {
    const duration = v.palletCount * minPerPallet;
    // Pick dock with earliest free time that is >= arrival
    let bestDock = dockIds[0];
    let bestStart = Infinity;

    for (const dockId of dockIds) {
      const start = Math.max(dockFreeAt[dockId], v.arrivalTime);
      if (start < bestStart) {
        bestStart = start;
        bestDock = dockId;
      }
    }

    const endTime = bestStart + duration;
    schedule.push({
      dockId: bestDock,
      vehicleRequestId: v.id,
      startTime: bestStart,
      endTime,
      waitTime: bestStart - v.arrivalTime
    });
    dockFreeAt[bestDock] = endTime;
  }

  const avgWaitTime =
    schedule.length > 0 ? schedule.reduce((s, x) => s + x.waitTime, 0) / schedule.length : 0;

  const totalProcessingHours = Object.values(dockFreeAt).reduce((s, t) => s + t, 0);

  const utilization: Record<string, number> = {};
  for (const dockId of dockIds) {
    const busyHours = schedule
      .filter((s) => s.dockId === dockId)
      .reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
    utilization[dockId] = Math.min(100, Math.round((busyHours / shiftDurationHours) * 100));
  }

  return { schedule, avgWaitTime, totalProcessingHours, utilization };
}
