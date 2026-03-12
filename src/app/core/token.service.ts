import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TokenService {
    setToken(token: string, persist: boolean = true) {
        if (persist) {
            localStorage.setItem('accessToken', token);
            sessionStorage.removeItem('accessToken');
        } else {
            sessionStorage.setItem('accessToken', token);
            localStorage.removeItem('accessToken');
        }
    }

    getToken(): string | null {
        // Check sessionStorage first as it is more specific to the current tab interaction
        return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    setRefreshToken(refreshToken: string, persist: boolean = true) {
        if (persist) {
            localStorage.setItem('refreshToken', refreshToken);
            sessionStorage.removeItem('refreshToken');
        } else {
            sessionStorage.setItem('refreshToken', refreshToken);
            localStorage.removeItem('refreshToken');
        }
    }

    getRefreshToken(): string | null {
        return sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
    }

    setItem(key: string, value: string, persist: boolean = true) {
        const storage = persist ? localStorage : sessionStorage;
        storage.setItem(key, value);
    }

    getItem(key: string): string | null {
        return localStorage.getItem(key) || sessionStorage.getItem(key);
    }

    removeItem(key: string) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    }

    clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');

        // Clear other common items
        this.removeItem('userId');
        this.removeItem('role');
        this.removeItem('userName');
    }

    // Decode and check token expiry
    getDecodedToken(token: string): any {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch {
            return null;
        }
    }

    getRole(): string | null {
        const token = this.getToken();
        if (!token) return null;
        const decoded = this.getDecodedToken(token);

        let role = decoded?.['role'] || decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

        if (Array.isArray(role)) {
            role = role[0];
        }

        return role || null;
    }

    isTokenExpired(token: string): boolean {
        const payload = this.getDecodedToken(token);
        if (!payload) return true;
        const expiry = payload.exp * 1000;
        return Date.now() > expiry;
    }

    // Used by guard
    isLoggedIn(): boolean {
        const token = this.getToken();
        return !!token && !this.isTokenExpired(token);
    }
}
