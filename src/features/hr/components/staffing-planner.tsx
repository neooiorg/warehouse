'use client';

import { useState, useTransition } from 'react';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Icons } from '@/components/icons';
import { staffingPlanListOptions, workTaskListOptions } from '../api/queries';
import {
  createStaffingPlan,
  deleteStaffingPlan,
  upsertWorkTask,
  deleteWorkTask,
  runAndSavePlan
} from '../api/service';
import { hrKeys } from '../api/queries';
import { runAonScheduler, type TaskInput } from '../utils/aon-scheduler';
import { proposeKpis } from '../utils/kpi-proposer';
import GanttView from './gantt-view';
import KpiProposalTable from './kpi-proposal-table';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6'];

export default function StaffingPlanner() {
  const qc = useQueryClient();
  const { data: plans } = useSuspenseQuery(staffingPlanListOptions());
  const [activePlanId, setActivePlanId] = useState<string | null>(plans[0]?.id ?? null);
  const [isPending, startTransition] = useTransition();

  // Create plan
  const [newPlanName, setNewPlanName] = useState('');
  const [headcount, setHeadcount] = useState(5);

  const handleCreatePlan = () => {
    startTransition(async () => {
      const { id } = await createStaffingPlan({
        name: newPlanName || 'Kế hoạch mới',
        availableHeadcount: headcount
      });
      qc.invalidateQueries({ queryKey: hrKeys.plans() });
      setActivePlanId(id);
      setNewPlanName('');
      toast.success('Tạo kế hoạch thành công');
    });
  };

  return (
    <div className='grid gap-6 lg:grid-cols-[280px_1fr]'>
      {/* Left: plan list */}
      <div className='space-y-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>Kế hoạch mới</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='space-y-1'>
              <Label className='text-xs'>Tên kế hoạch</Label>
              <Input
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder='Ca sáng tháng 7...'
                className='h-8 text-sm'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Số nhân sự sẵn sàng: {headcount}</Label>
              <Slider
                min={1}
                max={50}
                step={1}
                value={[headcount]}
                onValueChange={([v]) => setHeadcount(v)}
              />
            </div>
            <Button size='sm' className='w-full' onClick={handleCreatePlan} disabled={isPending}>
              <Icons.add className='mr-1 h-3 w-3' /> Tạo kế hoạch
            </Button>
          </CardContent>
        </Card>

        <div className='space-y-1'>
          {plans.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePlanId(p.id)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                activePlanId === p.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              <div className='font-medium'>{p.name}</div>
              <div className='text-xs opacity-70'>
                {p.availableHeadcount} người ·{' '}
                {p.criticalPathHours ? `${p.criticalPathHours.toFixed(1)}h` : 'Chưa chạy'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: active plan editor */}
      {activePlanId ? (
        <ActivePlanEditor planId={activePlanId} />
      ) : (
        <div className='text-muted-foreground flex items-center justify-center rounded-lg border p-12 text-sm'>
          Chọn hoặc tạo kế hoạch để bắt đầu
        </div>
      )}
    </div>
  );
}

function ActivePlanEditor({ planId }: { planId: string }) {
  const qc = useQueryClient();
  const { data: plans } = useSuspenseQuery(staffingPlanListOptions());
  const { data: tasks } = useSuspenseQuery(workTaskListOptions(planId));
  const plan = plans.find((p) => p.id === planId)!;

  const [isPending, startTransition] = useTransition();
  const [showGantt, setShowGantt] = useState(false);
  const [showKpi, setShowKpi] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<ReturnType<typeof runAonScheduler> | null>(
    null
  );

  // New task form
  const [taskName, setTaskName] = useState('');
  const [taskDuration, setTaskDuration] = useState(1);
  const [taskHeadcount, setTaskHeadcount] = useState(1);
  const [taskPreds, setTaskPreds] = useState<string[]>([]);

  const handleAddTask = () => {
    startTransition(async () => {
      const colorIdx = tasks.length % COLORS.length;
      await upsertWorkTask({
        planId,
        name: taskName,
        durationHours: taskDuration,
        requiredHeadcount: taskHeadcount,
        predecessorIds: taskPreds,
        color: COLORS[colorIdx]
      });
      qc.invalidateQueries({ queryKey: hrKeys.tasks(planId) });
      setTaskName('');
      setTaskPreds([]);
    });
  };

  const handleRunSchedule = () => {
    startTransition(async () => {
      await runAndSavePlan(planId);
      qc.invalidateQueries({ queryKey: hrKeys.tasks(planId) });
      qc.invalidateQueries({ queryKey: hrKeys.plans() });

      const result = runAonScheduler(
        tasks.map((t) => ({
          id: t.id,
          name: t.name,
          durationHours: t.durationHours,
          predecessorIds: (t.predecessorIds as string[]) ?? [],
          requiredHeadcount: t.requiredHeadcount,
          color: t.color ?? undefined
        })),
        plan.availableHeadcount
      );
      setScheduleResult(result);
      setShowGantt(true);
      toast.success('Đã chạy lịch định biên');
    });
  };

  const handleExportExcel = async () => {
    if (!scheduleResult) return;
    const { utils, writeFile } = await import('xlsx');
    const ws = utils.json_to_sheet(
      scheduleResult.tasks.map((t) => ({
        'Tên công việc': t.name,
        'Thời lượng (h)': t.durationHours,
        'Nhân lực cần': t.requiredHeadcount,
        'Bắt đầu (h)': t.scheduledStart,
        'Kết thúc (h)': t.scheduledEnd,
        'Tổng Float': t.totalFloat,
        'Đường găng': t.isCritical ? 'Có' : 'Không'
      }))
    );
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Gantt');
    writeFile(wb, `gantt-${plan.name}.xlsx`);
  };

  const handleExportPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(`Gantt: ${plan.name}`, 14, 16);
    let y = 28;
    doc.setFontSize(9);
    scheduleResult?.tasks.forEach((t) => {
      doc.text(
        `${t.name} | ${t.durationHours}h | ${t.scheduledStart}h→${t.scheduledEnd}h | ${t.isCritical ? '★ Găng' : ''}`,
        14,
        y
      );
      y += 7;
      if (y > 185) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save(`gantt-${plan.name}.pdf`);
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='font-semibold'>{plan.name}</h3>
          <p className='text-muted-foreground text-sm'>
            {plan.availableHeadcount} nhân sự · {tasks.length} đầu việc
          </p>
        </div>
        <div className='flex gap-2'>
          <Button size='sm' variant='outline' onClick={() => setShowKpi(!showKpi)}>
            Đề xuất KPI
          </Button>
          <Button size='sm' onClick={handleRunSchedule} disabled={isPending || tasks.length === 0}>
            <Icons.trendingUp className='mr-1 h-4 w-4' />
            Chạy lịch
          </Button>
        </div>
      </div>

      {/* Add task */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm'>Thêm đầu việc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            <div className='col-span-2 space-y-1'>
              <Label className='text-xs'>Tên công việc</Label>
              <Input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder='Kiểm đếm hàng nhập...'
                className='h-8'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Thời lượng (h)</Label>
              <Input
                type='number'
                min={0.5}
                step={0.5}
                value={taskDuration}
                onChange={(e) => setTaskDuration(+e.target.value)}
                className='h-8'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Nhân lực cần</Label>
              <Input
                type='number'
                min={1}
                value={taskHeadcount}
                onChange={(e) => setTaskHeadcount(+e.target.value)}
                className='h-8'
              />
            </div>
          </div>

          {tasks.length > 0 && (
            <div className='mt-3 space-y-1'>
              <Label className='text-xs'>Phụ thuộc vào (chọn nhiều)</Label>
              <div className='flex flex-wrap gap-2'>
                {tasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() =>
                      setTaskPreds((p) =>
                        p.includes(t.id) ? p.filter((x) => x !== t.id) : [...p, t.id]
                      )
                    }
                    className={`rounded px-2 py-1 text-xs transition-colors ${
                      taskPreds.includes(t.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            size='sm'
            className='mt-3'
            onClick={handleAddTask}
            disabled={isPending || !taskName}
          >
            <Icons.add className='mr-1 h-3 w-3' /> Thêm
          </Button>
        </CardContent>
      </Card>

      {/* Task list */}
      <div className='space-y-1'>
        {tasks.map((t, i) => (
          <div key={t.id} className='flex items-center gap-3 rounded-md border px-3 py-2 text-sm'>
            <span
              className='h-3 w-3 rounded-full flex-shrink-0'
              style={{ backgroundColor: t.color ?? COLORS[i % COLORS.length] }}
            />
            <span className='flex-1 font-medium'>{t.name}</span>
            <span className='text-muted-foreground'>{t.durationHours}h</span>
            <span className='text-muted-foreground'>{t.requiredHeadcount}👤</span>
            {t.isCritical ? (
              <Badge variant='destructive' className='text-xs'>
                Găng
              </Badge>
            ) : null}
            <Button
              size='icon'
              variant='ghost'
              className='h-6 w-6 text-destructive'
              onClick={() => {
                deleteWorkTask(t.id).then(() =>
                  qc.invalidateQueries({ queryKey: hrKeys.tasks(t.planId) })
                );
              }}
            >
              <Icons.trash className='h-3 w-3' />
            </Button>
          </div>
        ))}
      </div>

      {/* Gantt */}
      {showGantt && scheduleResult && (
        <GanttView
          result={scheduleResult}
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
        />
      )}

      {/* KPI proposals */}
      {showKpi && scheduleResult && (
        <KpiProposalTable proposals={proposeKpis(scheduleResult, plan.availableHeadcount)} />
      )}
    </div>
  );
}
