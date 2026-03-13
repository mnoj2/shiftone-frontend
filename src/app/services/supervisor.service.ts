import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SupervisorHomeSummary, SupervisorAnalytics } from '../core/models/supervisor.models';
import { AttendanceRecord } from '../core/models/worker.models';

@Injectable({ providedIn: 'root' })
export class SupervisorService {
  
  private supervisorUrl = `${environment.apiUrl}/supervisor`;

  constructor(private http: HttpClient) { }


  getByDateRange(startDate: string, endDate: string): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.supervisorUrl}/range?start=${startDate}&end=${endDate}`);
  }

  getAnalytics(month: number, year: number): Observable<SupervisorAnalytics> {
    return this.http.get<SupervisorAnalytics>(`${this.supervisorUrl}/analytics?month=${month}&year=${year}`);
  }

  getSupervisorHomeSummary(date: string | null = null): Observable<SupervisorHomeSummary> {
    let url = `${this.supervisorUrl}/home-summary`;
    if (date) {
      url += `?date=${date}`;
    }
    return this.http.get<SupervisorHomeSummary>(url);
  }

}
