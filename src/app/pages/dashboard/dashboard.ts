import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TokenService } from '../../core/token.service';
import { WorkerHome } from './worker-home/worker-home';
import { WorkerHistory } from './worker-history/worker-history';

@Component({
  selector: 'dashboard',
  standalone: true,
  imports: [CommonModule, WorkerHome, WorkerHistory],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard {

  currentView: 'home' | 'history' = 'home';

  constructor(
    private router: Router,
    private token: TokenService
  ) {}

  onViewChange(view: 'home' | 'history'): void {
    this.currentView = view;
  }

  logout(): void {
    this.token.clearTokens();
    this.router.navigate(['/login']);
  }
}