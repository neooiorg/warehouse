export type EmployeeProductivity = {
  employeeId: string;
  employeeName: string;
  role?: string | null;
  transactionCount: number;
  tasksCompleted: number;
  totalPallets: number;
  totalQty: number;
  avgDailyPallets: number;
  qtyPerHour: number;
  normalizedScore: number;
  standardRatePerHour: number;
  productivityRatePercent: number;
  rankScore: number;
};

export type ProductivitySummary = {
  employees: EmployeeProductivity[];
  periodDays: number;
  topPerformer: string | null;
};

export type DockAppointmentInput = {
  warehouseId: string;
  dockId: string;
  vehicleId?: string;
  direction: 'inbound' | 'outbound';
  palletCount: number;
  scheduledStart: Date;
  scheduledEnd: Date;
};

export type LogTaskPayload = {
  warehouseId?: string | null;
  employeeId: string;
  taskTypeId: string;
  startedAt: string | Date;
  completedAt?: string | Date | null;
  qty: number;
  unit?: string | null;
  note?: string | null;
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
  waitMinutes: number;
};

export type DockScheduleInput = {
  warehouseId: string;
  scheduleDate: string;
  forkliftsCount: number;
  minutesPerPallet: number;
  vehicles: VehicleSlot[];
};

export type DockScheduleResult = {
  id: string;
  assignments: DockAssignment[];
  docks: Array<{ id: string; code: string }>;
  avgWaitMinutes: number;
  totalCompletionMinutes: number;
  utilizationByDock: Record<string, number>;
  overloadWarnings: string[];
};

export type TaskLogImportRow = {
  line: number;
  employeeName: string;
  taskName: string;
  startedAt: string;
  completedAt: string;
  qty: number;
  unit?: string | null;
  warehouseCode?: string | null;
  note?: string | null;
};

export type TaskLogImportResult = {
  importedCount: number;
  errors: Array<{ line: number; message: string }>;
};
