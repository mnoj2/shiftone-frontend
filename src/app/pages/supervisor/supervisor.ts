import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TokenService } from '../../core/services/token.service';
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
    private token: TokenService
  ) {}

  onViewChange(view: 'home' | 'daily' | 'analytics'): void {
    this.currentView = view;
  }

  logout(): void {
    this.token.logout();
  }
}