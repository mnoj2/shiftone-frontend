import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private workerUrl = `${environment.apiUrl}/worker`;
  private supervisorUrl = `${environment.apiUrl}/supervisor`;
  private adminUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) { }

  // Get today's attendance info for current user (Worker)
  getTodayAttendance(): Observable<any> {
    return this.http.get(`${this.workerUrl}/today`);
  }

  // Sign In for current user (Worker)
  signIn(): Observable<any> {
    return this.http.post(`${this.workerUrl}/signin`, {});
  }

  // Sign Off for current user (Worker)
  signOff(): Observable<any> {
    return this.http.post(`${this.workerUrl}/signoff`, {});
  }

  // Manual Sign Off for forgotten sessions (Worker)
  manualSignOff(date: string, signOffTime: string): Observable<any> {
    return this.http.post(`${this.workerUrl}/manual-signoff`, { date, signOffTime });
  }

  // Confirm Auto Sign Off (Worker)
  confirmAutoSignOff(date: string, actualSignOffTime: string): Observable<any> {
    return this.http.post(`${this.workerUrl}/confirm-auto`, { date, actualTime: actualSignOffTime });
  }

  // Filter attendance records by date range
  getByDateRange(startDate: string, endDate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.supervisorUrl}/range?start=${startDate}&end=${endDate}`);
  }

  // Get Monthly Summary
  getMonthlySummary(month: number, year: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.supervisorUrl}/monthly-summary?month=${month}&year=${year}`);
  }

  // Get All Workers
  getAllWorkers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.supervisorUrl}/workers`);
  }


  // Get My History (Worker)
  getMyHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.workerUrl}/history`);
  }

  // Get Worker History (Supervisor)
  getWorkerHistory(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.supervisorUrl}/worker-history/${userId}`);
  }

  // Get Analytics (Supervisor)
  getAnalytics(month: number, year: number): Observable<any> {
    return this.http.get<any>(`${this.supervisorUrl}/analytics?month=${month}&year=${year}`);
  }

  // Get Stats (Supervisor)
  getSupervisorStats(): Observable<any> {
    return this.http.get<any>(`${this.supervisorUrl}/stats`);
  }

  // Get Supervisor Home Summary (Live Status, Progress, Attention)
  getSupervisorHomeSummary(date: string | null = null): Observable<any> {
    let url = `${this.supervisorUrl}/home-summary`;
    if (date) {
      url += `?date=${date}`;
    }
    return this.http.get<any>(url);
  }

}
