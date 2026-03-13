import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from './token.service';

export const loginGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const token = tokenService.getToken();
  const role = tokenService.getItem('role');

  if (token && !tokenService.isTokenExpired(token) && role) {
    if (role === 'Supervisor') {
      router.navigate(['/supervisor']);
    } else {
      router.navigate(['/dashboard']);
    }
    return false; 
  }

  return true;
};
