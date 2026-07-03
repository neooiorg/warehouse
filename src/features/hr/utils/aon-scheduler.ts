// AON (Activity-On-Node) Critical Path Method scheduler
// Implements forward/backward pass → ES/EF/LS/LF/Float
// Then applies greedy resource leveling

export type TaskInput = {
  id: string;
  name: string;
  durationHours: number;
  predecessorIds: string[];
  requiredHeadcount: number;
  color?: string;
};

export type ScheduledTask = TaskInput & {
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  totalFloat: number;
  isCritical: boolean;
  // After resource leveling
  scheduledStart: number;
  scheduledEnd: number;
  assignedSlots: number; // headcount actually assigned
};

export type ScheduleResult = {
  tasks: ScheduledTask[];
  criticalPathHours: number;
  totalDurationHours: number;
  requiredHeadcount: number; // peak headcount needed without leveling
};

// Topological sort (Kahn's algorithm)
function topoSort(tasks: TaskInput[]): TaskInput[] {
  const map = new Map(tasks.map((t) => [t.id, t]));
  const inDegree = new Map(tasks.map((t) => [t.id, 0]));
  tasks.forEach((t) =>
    t.predecessorIds.forEach((p) => inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1))
  );

  // reset - recount correctly
  tasks.forEach((t) => inDegree.set(t.id, 0));
  tasks.forEach((t) =>
    t.predecessorIds.forEach((p) => {
      const cur = inDegree.get(t.id) ?? 0;
      inDegree.set(t.id, cur + 1);
    })
  );

  const queue = tasks.filter((t) => inDegree.get(t.id) === 0).map((t) => t.id);
  const sorted: TaskInput[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    const task = map.get(id)!;
    sorted.push(task);
    tasks
      .filter((t) => t.predecessorIds.includes(id))
      .forEach((t) => {
        const deg = (inDegree.get(t.id) ?? 1) - 1;
        inDegree.set(t.id, deg);
        if (deg === 0) queue.push(t.id);
      });
  }

  return sorted;
}

export function runAonScheduler(tasks: TaskInput[], availableHeadcount: number): ScheduleResult {
  if (tasks.length === 0) {
    return { tasks: [], criticalPathHours: 0, totalDurationHours: 0, requiredHeadcount: 0 };
  }

  const sorted = topoSort(tasks);
  const map = new Map(sorted.map((t) => [t.id, t]));
  const es = new Map<string, number>();
  const ef = new Map<string, number>();
  const ls = new Map<string, number>();
  const lf = new Map<string, number>();

  // Forward pass
  sorted.forEach((t) => {
    const maxPredEF =
      t.predecessorIds.length === 0 ? 0 : Math.max(...t.predecessorIds.map((p) => ef.get(p) ?? 0));
    es.set(t.id, maxPredEF);
    ef.set(t.id, maxPredEF + t.durationHours);
  });

  const projectEnd = Math.max(...sorted.map((t) => ef.get(t.id) ?? 0));

  // Backward pass
  const successors = new Map<string, string[]>();
  sorted.forEach((t) => successors.set(t.id, []));
  sorted.forEach((t) => t.predecessorIds.forEach((p) => successors.get(p)?.push(t.id)));

  [...sorted].reverse().forEach((t) => {
    const succs = successors.get(t.id) ?? [];
    const minSuccLS =
      succs.length === 0 ? projectEnd : Math.min(...succs.map((s) => ls.get(s) ?? projectEnd));
    lf.set(t.id, minSuccLS);
    ls.set(t.id, minSuccLS - t.durationHours);
  });

  // Compute float & critical path
  const criticalPathHours = projectEnd;

  // Resource leveling: greedy — schedule tasks by ES, delay if headcount exceeded
  const scheduled = new Map<string, { start: number; end: number }>();
  const sortedByES = [...sorted].sort((a, b) => (es.get(a.id) ?? 0) - (es.get(b.id) ?? 0));

  sortedByES.forEach((t) => {
    let start = Math.max(
      es.get(t.id) ?? 0,
      ...t.predecessorIds.map((p) => scheduled.get(p)?.end ?? 0)
    );

    // Find earliest start where headcount is available
    // Sample at 0.5h intervals to check headcount at that moment
    const maxIter = 200;
    let iter = 0;
    while (iter < maxIter) {
      const end = start + t.durationHours;
      // Count concurrent tasks
      const concurrent = sortedByES
        .filter((other) => {
          if (other.id === t.id) return false;
          const os = scheduled.get(other.id);
          if (!os) return false;
          return os.start < end && os.end > start;
        })
        .reduce((sum, other) => sum + other.requiredHeadcount, 0);

      if (concurrent + t.requiredHeadcount <= availableHeadcount) break;
      start += 0.5;
      iter++;
    }

    scheduled.set(t.id, { start, end: start + t.durationHours });
  });

  const totalDurationHours = Math.max(...sorted.map((t) => scheduled.get(t.id)?.end ?? 0));

  const result: ScheduledTask[] = sorted.map((t) => {
    const float = (ls.get(t.id) ?? 0) - (es.get(t.id) ?? 0);
    const sched = scheduled.get(t.id) ?? { start: es.get(t.id) ?? 0, end: ef.get(t.id) ?? 0 };
    return {
      ...t,
      earlyStart: es.get(t.id) ?? 0,
      earlyFinish: ef.get(t.id) ?? 0,
      lateStart: ls.get(t.id) ?? 0,
      lateFinish: lf.get(t.id) ?? 0,
      totalFloat: Math.max(0, float),
      isCritical: Math.abs(float) < 0.001,
      scheduledStart: sched.start,
      scheduledEnd: sched.end,
      assignedSlots: t.requiredHeadcount
    };
  });

  const peakHeadcount = Math.max(
    ...result.map((t) => {
      const concurrent = result.filter(
        (o) =>
          o.id !== t.id && o.scheduledStart < t.scheduledEnd && o.scheduledEnd > t.scheduledStart
      );
      return t.requiredHeadcount + concurrent.reduce((s, o) => s + o.requiredHeadcount, 0);
    }),
    0
  );

  return { tasks: result, criticalPathHours, totalDurationHours, requiredHeadcount: peakHeadcount };
}
