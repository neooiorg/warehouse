export type EmployeeProductivity = {
  employeeId: string;
  employeeName: string;
  transactionCount: number;
  totalPallets: number;
  avgDailyPallets: number;
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
