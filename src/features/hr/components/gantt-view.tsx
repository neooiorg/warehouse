'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import type { ScheduledTask, ScheduleResult } from '../utils/aon-scheduler';

const HOUR_PX = 48; // pixels per hour
const ROW_H = 44;

type Props = { result: ScheduleResult; onExportExcel?: () => void; onExportPdf?: () => void };

export default function GanttView({ result, onExportExcel, onExportPdf }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  if (result.tasks.length === 0) {
    return (
      <p className='text-muted-foreground py-8 text-center text-sm'>
        Chưa có task nào để hiển thị.
      </p>
    );
  }

  const totalHours = Math.ceil(result.totalDurationHours) + 1;
  const svgWidth = totalHours * HOUR_PX + 160;
  const svgHeight = result.tasks.length * ROW_H + 40;
  const LABEL_W = 160;

  const hours = Array.from({ length: totalHours + 1 }, (_, i) => i);

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <div className='flex gap-2 text-sm'>
          <Badge variant='destructive'>Đường găng: {result.criticalPathHours.toFixed(1)}h</Badge>
          <Badge variant='secondary'>Tổng: {result.totalDurationHours.toFixed(1)}h</Badge>
          <Badge variant='outline'>Cao điểm: {result.requiredHeadcount} người</Badge>
        </div>
        <div className='flex gap-2'>
          {onExportExcel && (
            <Button size='sm' variant='outline' onClick={onExportExcel}>
              <Icons.fileTypeXls className='mr-1 h-4 w-4' /> Excel
            </Button>
          )}
          {onExportPdf && (
            <Button size='sm' variant='outline' onClick={onExportPdf}>
              <Icons.fileTypePdf className='mr-1 h-4 w-4' /> PDF
            </Button>
          )}
        </div>
      </div>

      <div className='overflow-x-auto rounded-lg border'>
        <svg ref={svgRef} width={svgWidth} height={svgHeight} style={{ display: 'block' }}>
          {/* Hour grid */}
          {hours.map((h) => (
            <g key={h}>
              <line
                x1={LABEL_W + h * HOUR_PX}
                y1={0}
                x2={LABEL_W + h * HOUR_PX}
                y2={svgHeight}
                stroke='#27272a'
                strokeWidth={1}
              />
              <text x={LABEL_W + h * HOUR_PX + 3} y={14} fontSize={10} fill='#71717a'>
                {h}h
              </text>
            </g>
          ))}

          {/* Row backgrounds */}
          {result.tasks.map((t, i) => (
            <rect
              key={`bg-${t.id}`}
              x={0}
              y={i * ROW_H + 20}
              width={svgWidth}
              height={ROW_H}
              fill={i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
            />
          ))}

          {/* Task bars */}
          {result.tasks.map((t, i) => {
            const x = LABEL_W + t.scheduledStart * HOUR_PX;
            const w = Math.max((t.scheduledEnd - t.scheduledStart) * HOUR_PX - 4, 4);
            const y = i * ROW_H + 26;
            const color = t.color ?? (t.isCritical ? '#ef4444' : '#6366f1');

            return (
              <g key={t.id}>
                {/* Label */}
                <text
                  x={4}
                  y={i * ROW_H + 20 + ROW_H / 2 + 4}
                  fontSize={11}
                  fill='#e4e4e7'
                  className='font-medium'
                >
                  {t.name.length > 18 ? t.name.slice(0, 17) + '…' : t.name}
                </text>

                {/* Free float bar (light) */}
                {t.totalFloat > 0.01 && (
                  <rect
                    x={x + w + 2}
                    y={y + 10}
                    width={t.totalFloat * HOUR_PX}
                    height={ROW_H - 22}
                    rx={2}
                    fill={color}
                    fillOpacity={0.2}
                  />
                )}

                {/* Task bar */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={ROW_H - 12}
                  rx={4}
                  fill={color}
                  fillOpacity={0.9}
                />

                {/* Task label inside bar */}
                {w > 60 && (
                  <text
                    x={x + w / 2}
                    y={y + (ROW_H - 12) / 2 + 4}
                    textAnchor='middle'
                    fontSize={10}
                    fill='white'
                    fontWeight={600}
                  >
                    {t.durationHours}h · {t.requiredHeadcount}👤
                  </text>
                )}

                {/* Critical marker */}
                {t.isCritical && (
                  <rect x={x} y={y} width={3} height={ROW_H - 12} rx={1} fill='#fbbf24' />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className='flex gap-4 text-xs text-zinc-400'>
        <span>
          <span className='inline-block h-3 w-3 rounded bg-red-500 mr-1' />
          Đầu việc đường găng
        </span>
        <span>
          <span className='inline-block h-3 w-3 rounded bg-indigo-500 mr-1' />
          Đầu việc thường
        </span>
        <span>
          <span className='inline-block h-3 w-3 rounded bg-yellow-400 mr-1' />
          Dấu đường găng
        </span>
      </div>
    </div>
  );
}
