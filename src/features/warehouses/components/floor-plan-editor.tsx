'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { locationListOptions, zoneListOptions } from '../api/queries';
import { useUpdateLocation } from '../api/mutations';
import type { Location, ZoneWithLocations } from '../api/types';

const CELL = 40; // px per grid cell
const COLS = 20;
const ROWS = 15;

type DragState = {
  locationId: string;
  startMouseX: number;
  startMouseY: number;
  startPosX: number;
  startPosY: number;
};

type Props = { warehouseId: string };

export default function FloorPlanEditor({ warehouseId }: Props) {
  const { data: locations } = useSuspenseQuery(locationListOptions(warehouseId));
  const { data: zones } = useSuspenseQuery(zoneListOptions(warehouseId));
  const updateLocation = useUpdateLocation(warehouseId);

  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Init positions from DB or assign default grid slot
  useEffect(() => {
    const init: typeof positions = {};
    locations.forEach((loc, i) => {
      init[loc.id] = {
        x: loc.posX ?? i % COLS,
        y: loc.posY ?? Math.floor(i / COLS),
        w: loc.posWidth ?? (loc.type === 'rack' ? 1 : 2),
        h: loc.posHeight ?? (loc.type === 'rack' ? 2 : 1)
      };
    });
    setPositions(init);
  }, [locations]);

  const zoneColor = (zoneId: string | null): string => {
    if (!zoneId) return '#6366f1';
    const idx = zones.findIndex((z) => z.id === zoneId) % 8;
    const palette = [
      '#6366f1',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#3b82f6',
      '#ec4899',
      '#8b5cf6',
      '#14b8a6'
    ];
    return palette[idx];
  };

  const onMouseDown = (e: React.MouseEvent, locId: string) => {
    e.preventDefault();
    const pos = positions[locId];
    if (!pos) return;
    setSelected(locId);
    setDrag({
      locationId: locId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y
    });
  };

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!drag) return;
      const dx = Math.round((e.clientX - drag.startMouseX) / CELL);
      const dy = Math.round((e.clientY - drag.startMouseY) / CELL);
      const newX = Math.max(0, Math.min(COLS - 1, drag.startPosX + dx));
      const newY = Math.max(0, Math.min(ROWS - 1, drag.startPosY + dy));
      setPositions((prev) => ({
        ...prev,
        [drag.locationId]: { ...prev[drag.locationId], x: newX, y: newY }
      }));
    },
    [drag]
  );

  const onMouseUp = useCallback(() => {
    if (!drag) return;
    const pos = positions[drag.locationId];
    if (pos) {
      updateLocation.mutate({
        id: drag.locationId,
        posX: pos.x,
        posY: pos.y,
        posWidth: pos.w,
        posHeight: pos.h
      });
    }
    setDrag(null);
  }, [drag, positions, updateLocation]);

  useEffect(() => {
    if (drag) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [drag, onMouseMove, onMouseUp]);

  const selectedLoc = selected ? locations.find((l) => l.id === selected) : null;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='text-muted-foreground text-sm'>
          Kéo vị trí để di chuyển. Thay đổi tự động lưu vào DB.
        </div>
        <div className='flex flex-wrap gap-2'>
          {zones.map((z, i) => (
            <Badge key={z.id} style={{ backgroundColor: zoneColor(z.id) }} className='text-white'>
              {z.code}
            </Badge>
          ))}
          <Badge style={{ backgroundColor: '#6366f1' }} className='text-white'>
            Chưa phân khu
          </Badge>
        </div>
      </div>

      <div className='overflow-auto rounded-lg border bg-zinc-950 p-2'>
        <svg
          ref={svgRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          className='block select-none'
          style={{ cursor: drag ? 'grabbing' : 'default' }}
        >
          {/* Grid lines */}
          {Array.from({ length: COLS + 1 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * CELL}
              y1={0}
              x2={i * CELL}
              y2={ROWS * CELL}
              stroke='#27272a'
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: ROWS + 1 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * CELL}
              x2={COLS * CELL}
              y2={i * CELL}
              stroke='#27272a'
              strokeWidth={1}
            />
          ))}

          {/* Location blocks */}
          {locations.map((loc) => {
            const pos = positions[loc.id];
            if (!pos) return null;
            const x = pos.x * CELL;
            const y = pos.y * CELL;
            const w = pos.w * CELL;
            const h = pos.h * CELL;
            const color = zoneColor(loc.zoneId ?? null);
            const isSelected = selected === loc.id;

            return (
              <g
                key={loc.id}
                onMouseDown={(e) => onMouseDown(e, loc.id)}
                style={{ cursor: 'grab' }}
              >
                <rect
                  x={x + 2}
                  y={y + 2}
                  width={w - 4}
                  height={h - 4}
                  rx={4}
                  fill={color}
                  fillOpacity={0.85}
                  stroke={isSelected ? '#fff' : color}
                  strokeWidth={isSelected ? 2 : 0}
                />
                <text
                  x={x + w / 2}
                  y={y + h / 2 - (loc.type === 'rack' ? 6 : 0)}
                  textAnchor='middle'
                  dominantBaseline='middle'
                  fill='white'
                  fontSize={10}
                  fontWeight={600}
                >
                  {loc.code}
                </text>
                {loc.type === 'rack' && loc.level && (
                  <text
                    x={x + w / 2}
                    y={y + h / 2 + 10}
                    textAnchor='middle'
                    dominantBaseline='middle'
                    fill='rgba(255,255,255,0.7)'
                    fontSize={8}
                  >
                    T{loc.level}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {selectedLoc && (
        <div className='bg-muted rounded-md p-3 text-sm'>
          <strong>{selectedLoc.code}</strong> · {selectedLoc.type === 'rack' ? 'Kệ rack' : 'Sàn'}
          {selectedLoc.level ? ` · Tầng ${selectedLoc.level}` : ''}
          {selectedLoc.capacityWeight ? ` · ${selectedLoc.capacityWeight} kg` : ''}
          {positions[selectedLoc.id] &&
            ` · Vị trí (${positions[selectedLoc.id].x}, ${positions[selectedLoc.id].y})`}
        </div>
      )}
    </div>
  );
}
