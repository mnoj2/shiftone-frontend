import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

export const loginGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const token = tokenService.getToken();
  const role = tokenService.getItem('role');

  // Redirect already authenticated users to their respective home page
  if (token && !tokenService.isTokenExpired(token) && role) {
    if (role === 'Supervisor') {
      router.navigate(['/supervisor']);
    }
    else if (role === 'Admin') {
      router.navigate(['/admin']);
    }
    else if (role === 'Worker') {
      router.navigate(['/dashboard']);
    }
    return false;
  }

  return true;
};