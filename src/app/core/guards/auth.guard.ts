import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

export const authGuard: CanActivateFn = (route) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const token = tokenService.getToken();
  const requiredRole = route.data['role'];

  // Redirect to login if token is missing or expired
  if (!token || tokenService.isTokenExpired(token)) {
    router.navigate(['/login']);
    return false;
  }

  if (requiredRole) {
    const userRole = tokenService.getRole();

    const roleMatches = userRole && userRole.toLowerCase().trim() === requiredRole.toLowerCase().trim();

    // Redirect to the user's respective home page if their role doesn't match the required role
    if (!roleMatches) {
      if (userRole?.toLowerCase() === 'admin') router.navigate(['/admin']);
      else if (userRole?.toLowerCase() === 'supervisor') router.navigate(['/supervisor']);
      else if (userRole?.toLowerCase() === 'worker') router.navigate(['/dashboard']);
      else router.navigate(['/login']);

      return false;
    }
  }

  return true;
};