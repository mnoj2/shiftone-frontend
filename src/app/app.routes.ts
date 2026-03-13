import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Supervisor } from './pages/supervisor/supervisor';
import { AdminComponent } from './pages/admin/admin';
import { authGuard } from './core/auth.guard';
import { loginGuard } from './core/login.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login, canActivate: [loginGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard], data: { role: 'Worker' } },
  { path: 'supervisor', component: Supervisor, canActivate: [authGuard], data: { role: 'Supervisor' } },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard], data: { role: 'Admin' } },
  { path: '**', redirectTo: 'login' }
];
