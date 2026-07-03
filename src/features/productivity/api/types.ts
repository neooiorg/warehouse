import type { taskLogs, dockSchedules } from '@/db/schema';

export type TaskLog = typeof taskLogs.$inferSelect;
export type DockSchedule = typeof dockSchedules.$inferSelect;

export type TaskLogFilters = {
  warehouseId?: string;
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type ProductivityScore = {
  employeeId: string;
  employeeName: string;
  role: string | null;
  tasksCompleted: number;
  totalQty: number;
  totalMinutes: number;
  qtyPerHour: number;
};

export type VehicleSlot = {
  plateNumber: string;
  arrivalTime: string;
  palletCount: number;
  direction: 'inbound' | 'outbound';
};

export type DockAssignment = {
  dockId: string;
  dockCode: string;
  vehiclePlate: string;
  startTime: string;
  endTime: string;
  direction: 'inbound' | 'outbound';
  palletCount: number;
};

export type DockScheduleInput = {
  warehouseId: string;
  scheduleDate: string;
  forkliftsCount: number;
  minutesPerPallet: number;
  vehicles: VehicleSlot[];
};

export type LogTaskPayload = {
  warehouseId: string;
  employeeId: string;
  taskTypeId: string;
  startedAt: string;
  completedAt?: string;
  qty: number;
  unit?: string;
  note?: string;
};
