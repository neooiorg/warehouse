import type { AonNode, StaffingResult } from '../api/types';
import type { WorkflowTask } from '../api/types';

export function computeAon(tasks: WorkflowTask[], dailyVolume: number, workHoursPerShift: number): StaffingResult {
  if (tasks.length === 0) {
    return { nodes: [], criticalPath: [], headcountByRole: {}, totalDurationMinutes: 0 };
  }

  const nodeMap = new Map<string, AonNode>();
  for (const t of tasks) {
    nodeMap.set(t.id, {
      id: t.id,
      name: t.name,
      estimatedMinutes: t.estimatedMinutes,
      requiredRole: t.requiredRole,
      dependencies: (t.dependencies as string[]) ?? [],
      earliestStart: 0,
      earliestFinish: t.estimatedMinutes,
      latestStart: 0,
      latestFinish: t.estimatedMinutes,
      float: 0,
      isCritical: false
    });
  }

  // Topological sort
  const visited = new Set<string>();
  const order: string[] = [];
  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = nodeMap.get(id);
    if (!node) return;
    for (const dep of node.dependencies) visit(dep);
    order.push(id);
  }
  for (const t of tasks) visit(t.id);

  // Forward pass
  for (const id of order) {
    const node = nodeMap.get(id)!;
    let es = 0;
    for (const dep of node.dependencies) {
      const depNode = nodeMap.get(dep);
      if (depNode) es = Math.max(es, depNode.earliestFinish);
    }
    node.earliestStart = es;
    node.earliestFinish = es + node.estimatedMinutes;
  }

  const maxEF = Math.max(...[...nodeMap.values()].map((n) => n.earliestFinish));

  // Backward pass
  for (const id of [...order].reverse()) {
    const node = nodeMap.get(id)!;
    const successors = [...nodeMap.values()].filter((n) => n.dependencies.includes(id));
    const lf = successors.length === 0 ? maxEF : Math.min(...successors.map((s) => s.latestStart));
    node.latestFinish = lf;
    node.latestStart = lf - node.estimatedMinutes;
    node.float = node.latestStart - node.earliestStart;
    node.isCritical = node.float === 0;
  }

  // Critical path
  const criticalPath = [...nodeMap.values()].filter((n) => n.isCritical).map((n) => n.id);

  // Headcount: ceil(totalWorkMinutes / (workHoursPerShift * 60))
  const headcountByRole: Record<string, number> = {};
  for (const node of nodeMap.values()) {
    const role = node.requiredRole ?? 'General';
    const totalMin = node.estimatedMinutes * dailyVolume;
    const needed = Math.ceil(totalMin / (workHoursPerShift * 60));
    headcountByRole[role] = (headcountByRole[role] ?? 0) + needed;
  }

  return {
    nodes: [...nodeMap.values()],
    criticalPath,
    headcountByRole,
    totalDurationMinutes: maxEF
  };
}
