import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from './token.service';

export const loginGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const token = tokenService.getToken();
  const role = tokenService.getItem('role');

  // If user is ALREADY logged in, redirect them to their dashboard
  if (token && !tokenService.isTokenExpired(token) && role) {
    if (role === 'Supervisor') {
      router.navigate(['/supervisor']);
    } else {
      router.navigate(['/dashboard']);
    }
    return false; // Prevent access to login page
  }

  // If not logged in, allow access to login page
  return true;
};
