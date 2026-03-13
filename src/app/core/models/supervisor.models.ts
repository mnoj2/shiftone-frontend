export interface SupervisorHomeSummary {
  totalWorkers: number;
  completedShifts: number;
  inProgressShifts: number;
}

export interface DailyHours {
  date: string;
  hours: number;
}

export interface SupervisorAnalytics {
  monthlyHours: DailyHours[];
}
