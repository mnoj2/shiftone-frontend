import { Injectable, Injector } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  
  constructor(private injector: Injector, private router: Router) { }

  setToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  setRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clearTokens(): void {
    ['accessToken', 'refreshToken', 'userId', 'role', 'userName'].forEach(key =>
      localStorage.removeItem(key)
    );
  }

  getDecodedToken(token: string): any {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      ));
    } catch {
      return null;
    }
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const decoded = this.getDecodedToken(token);
    let role = decoded?.['role'] ?? decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    if (Array.isArray(role)) role = role[0];
    return role || null;
  }

  isTokenExpired(token: string): boolean {
    const payload = this.getDecodedToken(token);
    if (!payload) return true;
    return Date.now() > payload.exp * 1000;
  }

  async logout(): Promise<void> {
    const authService = this.injector.get(AuthService);
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await firstValueFrom(authService.revokeToken(refreshToken));
      } catch (e) {
        console.error('Logout revocation failed', e);
      }
    }
    this.clearTokens();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }
}