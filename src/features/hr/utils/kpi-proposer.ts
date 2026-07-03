// KPI proposal engine: derives KPI suggestions from staffing plan output
import type { ScheduleResult } from './aon-scheduler';

export type KpiProposal = {
  id: string;
  name: string;
  formula: string;
  target: string;
  unit: string;
  rationale: string;
};

export function proposeKpis(schedule: ScheduleResult, availableHeadcount: number): KpiProposal[] {
  const utilization =
    schedule.requiredHeadcount > 0
      ? Math.min(100, Math.round((schedule.requiredHeadcount / availableHeadcount) * 100))
      : 0;

  const proposals: KpiProposal[] = [
    {
      id: 'throughput_per_person',
      name: 'Năng suất/người',
      formula: 'Tổng đầu việc hoàn thành ÷ Số nhân sự × Giờ làm việc',
      target: `≥ ${(schedule.tasks.length / Math.max(availableHeadcount, 1)).toFixed(1)} đầu việc/người`,
      unit: 'đầu việc/người/ca',
      rationale: `Dựa trên ${schedule.tasks.length} tasks và ${availableHeadcount} nhân sự.`
    },
    {
      id: 'utilization_rate',
      name: 'Tỷ lệ sử dụng nhân lực',
      formula: 'Số nhân sự cần thiết ÷ Số nhân sự hiện có × 100%',
      target: '75% – 90%',
      unit: '%',
      rationale: `Hiện tại ước tính ${utilization}% theo kế hoạch định biên.`
    },
    {
      id: 'on_time_completion',
      name: 'Tỷ lệ hoàn thành đúng hạn',
      formula: 'Số tasks hoàn thành trước deadline ÷ Tổng tasks × 100%',
      target: '≥ 95%',
      unit: '%',
      rationale: 'Tiêu chuẩn vận hành kho xuất/nhập.'
    },
    {
      id: 'critical_path_adherence',
      name: 'Tuân thủ đường găng',
      formula: 'Thời gian thực tế hoàn thành đường găng ÷ Kế hoạch × 100%',
      target: '≤ 105%',
      unit: '%',
      rationale: `Đường găng kế hoạch: ${schedule.criticalPathHours.toFixed(1)} giờ. Cho phép trễ tối đa 5%.`
    },
    {
      id: 'turnover_rate',
      name: 'Tỷ lệ nghỉ việc',
      formula: 'Số nhân viên nghỉ trong kỳ ÷ Bình quân nhân sự trong kỳ × 100%',
      target: '≤ 5%/tháng',
      unit: '%/tháng',
      rationale: 'KPI ổn định nhân sự — tỷ lệ cao ảnh hưởng năng suất đường găng.'
    },
    {
      id: 'avg_tenure',
      name: 'Thời gian gắn bó trung bình',
      formula: 'Tổng số tháng làm việc ÷ Số nhân viên (kể cả đã nghỉ)',
      target: '≥ 12 tháng',
      unit: 'tháng',
      rationale: 'Nhân viên gắn bó lâu → giảm chi phí đào tạo lại.'
    }
  ];

  return proposals;
}
