import type { DockAssignment, VehicleSlot } from '../api/types';

type Dock = { id: string; code: string; direction: 'inbound' | 'outbound' | 'both' };

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
): DockAssignment[] {
  const sorted = [...vehicles].sort((a, b) => timeToMinutes(a.arrivalTime) - timeToMinutes(b.arrivalTime));
  const dockAvailable = new Map<string, number>(docks.map((d) => [d.id, 0]));
  const assignments: DockAssignment[] = [];

  for (const v of sorted) {
    const arrival = timeToMinutes(v.arrivalTime);
    const processingTime = Math.ceil((v.palletCount * minutesPerPallet) / forkliftsCount);

    // Find earliest compatible dock
    const eligible = docks.filter(
      (d) => d.direction === v.direction || d.direction === 'both'
    );

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
    dockAvailable.set(bestDock.id, endTime);

    assignments.push({
      dockId: bestDock.id,
      dockCode: bestDock.code,
      vehiclePlate: v.plateNumber,
      startTime: minutesToTime(bestStart),
      endTime: minutesToTime(endTime),
      direction: v.direction,
      palletCount: v.palletCount
    });
  }

  return assignments;
}
