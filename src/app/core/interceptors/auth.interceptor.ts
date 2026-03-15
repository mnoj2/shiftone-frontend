import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service'; 
import { AuthService } from '../services/auth.service'; 
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const token = tokenService.getToken();

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        const refreshToken = tokenService.getRefreshToken();
        if (refreshToken) {
          return authService.refreshToken(refreshToken).pipe(
            switchMap((res: any) => {
              tokenService.setToken(res.accessToken);
              tokenService.setRefreshToken(res.refreshToken);
              const clonedReq = req.clone({
                setHeaders: { Authorization: `Bearer ${res.accessToken}` }
              });
              return next(clonedReq);
            }),
            catchError((refreshError) => {
              tokenService.logout();
              return throwError(() => refreshError);
            })
          );
        } else {
          tokenService.logout();
        }
      }
      return throwError(() => error);
    })
  );
};
