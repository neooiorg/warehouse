import type { DockAssignment, VehicleSlot } from '../api/types';

type Dock = { id: string; code: string; direction: 'inbound' | 'outbound' | 'both' };
type DockUtilization = Record<string, number>;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function scheduleDocks(
  docks: Dock[],
  vehicles: VehicleSlot[],
  forkliftsCount: number,
  minutesPerPallet: number
): {
  assignments: DockAssignment[];
  avgWaitMinutes: number;
  totalCompletionMinutes: number;
  utilizationByDock: DockUtilization;
  overloadWarnings: string[];
} {
  const sorted = [...vehicles].sort(
    (a, b) => timeToMinutes(a.arrivalTime) - timeToMinutes(b.arrivalTime)
  );
  const dockAvailable = new Map<string, number>(docks.map((d) => [d.id, 0]));
  const assignments: DockAssignment[] = [];
  const busyMinutes = new Map<string, number>(docks.map((dock) => [dock.id, 0]));
  const overloadWarnings: string[] = [];
  let totalWaitMinutes = 0;
  let maxEndTime = 0;

  for (const v of sorted) {
    const arrival = timeToMinutes(v.arrivalTime);
    const processingTime = Math.ceil(
      (v.palletCount * minutesPerPallet) / Math.max(forkliftsCount, 1)
    );

    // Find earliest compatible dock
    const eligible = docks.filter((d) => d.direction === v.direction || d.direction === 'both');

    let bestDock: Dock | null = null;
    let bestStart = Infinity;

    for (const d of eligible) {
      const avail = dockAvailable.get(d.id) ?? 0;
      const start = Math.max(arrival, avail);
      if (start < bestStart) {
        bestStart = start;
        bestDock = d;
      }
    }

    if (!bestDock) continue;

    const endTime = bestStart + processingTime;
    const waitMinutes = Math.max(bestStart - arrival, 0);
    dockAvailable.set(bestDock.id, endTime);
    busyMinutes.set(bestDock.id, (busyMinutes.get(bestDock.id) ?? 0) + processingTime);
    totalWaitMinutes += waitMinutes;
    maxEndTime = Math.max(maxEndTime, endTime);

    if (waitMinutes > 30) {
      overloadWarnings.push(
        `Xe ${v.plateNumber} cho ${bestDock.code} phai doi ${waitMinutes} phut. Can mo them dock hoac doi ca xe nang.`
      );
    }

    assignments.push({
      dockId: bestDock.id,
      dockCode: bestDock.code,
      vehiclePlate: v.plateNumber,
      startTime: minutesToTime(bestStart),
      endTime: minutesToTime(endTime),
      direction: v.direction,
      palletCount: v.palletCount,
      waitMinutes
    });
  }

  const firstArrival = sorted[0] ? timeToMinutes(sorted[0].arrivalTime) : 0;
  const totalWindow = Math.max(maxEndTime - firstArrival, 0);
  const utilizationByDock = docks.reduce<DockUtilization>((acc, dock) => {
    const utilization =
      totalWindow > 0 ? Math.round(((busyMinutes.get(dock.id) ?? 0) / totalWindow) * 100) : 0;
    acc[dock.code] = utilization;
    if (utilization > 85) {
      overloadWarnings.push(`Dock ${dock.code} dang tai ${utilization}% cua cua so xu ly.`);
    }
    return acc;
  }, {});

  return {
    assignments,
    avgWaitMinutes: assignments.length > 0 ? Math.round(totalWaitMinutes / assignments.length) : 0,
    totalCompletionMinutes: totalWindow,
    utilizationByDock,
    overloadWarnings: [...new Set(overloadWarnings)]
  };
}
