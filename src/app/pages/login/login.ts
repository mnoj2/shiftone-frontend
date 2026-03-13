import { Component, NgZone } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { TokenService } from '../../core/token.service';
import { HotToastService } from '@ngneat/hot-toast';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'login',
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {

  email = '';
  password = '';

  hidePassword = true;
  loading = false;
  errorMessage = 'An unexpected error occurred';

  emailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(?:\\.[a-zA-Z]{2,})?$';

  constructor(
    private auth: AuthService,
    private tokenService: TokenService,
    private router: Router,
    private ngZone: NgZone,
    private toast: HotToastService
  ) {}

  onSubmit(form: NgForm): void {
    if (form.invalid) return;

    this.loading = true;

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.tokenService.setToken(res.accessToken);
        this.tokenService.setRefreshToken(res.refreshToken);

        const decoded = this.tokenService.getDecodedToken(res.accessToken);
        let role = decoded?.['role'] ?? decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        const id = decoded?.['id'];
        const name = decoded?.['name'] ?? decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];

        if (!role || !id) {
          this.loading = false;
          this.toast.error('Invalid email or password.');
          return;
        }

        this.tokenService.setItem('userId', id);
        this.tokenService.setItem('role', role);
        this.tokenService.setItem('userName', name);

        this.toast.success('Login successful! Redirecting...');
        this.loading = false;

        setTimeout(() => {
          this.ngZone.run(() => {
            const routes: Record<string, string> = {
              admin: '/admin',
              supervisor: '/supervisor',
              worker: '/dashboard'
            };
            const path = routes[String(role).trim().toLowerCase()] ?? '/login';
            this.router.navigate([path]);
          });
        }, 1000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = (err.status === 401 || err.status === 400)
          ? 'Invalid email or password.'
          : this.errorMessage;
        this.toast.error(this.errorMessage);
      }
    });
  }
}