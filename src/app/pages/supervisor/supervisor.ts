import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TokenService } from '../../core/token.service';
import { SupervisorHome } from './supervisor-home/supervisor-home';
import { SupervisorDaily } from './supervisor-daily/supervisor-daily';

@Component({
  selector: 'supervisor',
  standalone: true,
  imports: [CommonModule, SupervisorHome, SupervisorDaily],
  templateUrl: './supervisor.html',
  styleUrls: ['./supervisor.scss']
})
export class Supervisor {

  currentView: 'home' | 'daily' | 'analytics' = 'home';

  constructor(
    private router: Router,
    private token: TokenService
  ) {}

  onViewChange(view: 'home' | 'daily' | 'analytics'): void {
    this.currentView = view;
  }

  logout(): void {
    this.token.clearTokens();
    this.router.navigate(['/login']);
  }
}