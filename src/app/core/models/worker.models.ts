export interface AttendanceInfo {
  status: string;
  signInTime?: string;
  signOffTime?: string;
  totalHours?: number;
}

export interface AttendanceRecord {
  date: string;
  userId: number;
  workerName: string;
  signInTime?: string;
  signOffTime?: string;
  status: string;
  totalHours?: number;
}
