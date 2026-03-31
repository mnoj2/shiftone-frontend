import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AttendanceInfo, AttendanceRecord } from '../core/models/worker.models';

@Injectable({ providedIn: 'root' })
export class WorkerService {

  private workerUrl = `${environment.apiUrl}/worker`;

  constructor(private http: HttpClient) { }


  getTodayAttendance(): Observable<AttendanceInfo> {
    return this.http.get<AttendanceInfo>(`${this.workerUrl}/today`);
  }

  signIn(lat: any, lng: any): Observable<any> {
    return this.http.post(`${this.workerUrl}/signin`, {lat, lng});
  }

  signOff(lat: any, lng: any): Observable<any> {
    return this.http.post(`${this.workerUrl}/signoff`, {lat, lng});
  }

  manualSignOff(date: string, signOffTime: string): Observable<any> {
    return this.http.post(`${this.workerUrl}/manual-signoff`, { date, signOffTime });
  }

  getMyHistory(): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.workerUrl}/history`);
  }
}
