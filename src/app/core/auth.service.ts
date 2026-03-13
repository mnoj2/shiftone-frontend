import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse, UserCredentials } from './models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  login(credentials: UserCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
      email: credentials.email,
      password: credentials.password
    });
  }

  refreshToken(token: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, `"${token}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  revokeToken(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/revoke`, `"${token}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
