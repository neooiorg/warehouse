import type { KpiProposal } from '../api/types';
import type { ScheduleResult } from './aon-scheduler';

export function proposeKpis(schedule: ScheduleResult, availableHeadcount: number): KpiProposal[] {
  const utilizationPercent =
    schedule.requiredHeadcount > 0
      ? Math.min(
          100,
          Math.round((schedule.requiredHeadcount / Math.max(availableHeadcount, 1)) * 100)
        )
      : 0;
  const criticalTasks = schedule.tasks.filter((task) => task.isCritical).length;
  const throughputTarget = Number(
    (
      schedule.tasks.reduce((sum, task) => sum + task.requiredHeadcount, 0) /
      Math.max(availableHeadcount, 1)
    ).toFixed(1)
  );

  return [
    {
      id: 'throughput-per-head',
      role: 'warehouse_operator',
      kpiName: 'Nang suat theo nguoi',
      formula: 'Tong san luong thuc hien / tong gio cong',
      target: throughputTarget,
      unit: 'don vi/gio-cong',
      weight: 0.35,
      mechanism: 'Cham 100 diem khi dat target, vuot target tinh toi da 120 diem.',
      rationale: `Ke hoach co ${schedule.tasks.length} dau viec va can ${schedule.requiredHeadcount} suat nhan luc o dinh.`
    },
    {
      id: 'critical-path-adherence',
      role: 'team_lead',
      kpiName: 'Bam duong gang',
      formula: 'Thoi gian thuc te duong gang / thoi gian ke hoach duong gang * 100',
      target: 105,
      unit: '%',
      weight: 0.3,
      mechanism: 'Duoi 100% dat toi da, 100-105% dat, vuot 105% tru diem theo bac.',
      rationale: `${criticalTasks} dau viec nam tren duong gang, tong thoi luong ${schedule.criticalPathHours.toFixed(1)} gio.`
    },
    {
      id: 'labor-utilization',
      role: 'warehouse_manager',
      kpiName: 'Su dung nhan luc',
      formula: 'Nhu cau dinh bien / nhan su san sang * 100',
      target: Math.max(utilizationPercent, 75),
      unit: '%',
      weight: 0.2,
      mechanism: 'Khoang 75-90% dat muc tot, thap hon hoac cao hon deu tru diem.',
      rationale: `Ty le su dung nhan luc hien tai la ${utilizationPercent}%.`
    },
    {
      id: 'on-time-task-completion',
      role: 'supervisor',
      kpiName: 'Hoan thanh dung han',
      formula: 'So dau viec ket thuc trong cua so ke hoach / tong dau viec * 100',
      target: 95,
      unit: '%',
      weight: 0.15,
      mechanism: 'Moi dau viec tre tren 30 phut se bi tru 2 diem.',
      rationale: 'Chi so nay giu Gantt va staffing plan gan voi van hanh thuc te.'
    }
  ];
}
