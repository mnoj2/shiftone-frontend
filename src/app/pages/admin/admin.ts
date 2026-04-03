import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TokenService } from '../../core/services/token.service';
import { AdminHome } from './admin-home/admin-home';
import { QuickEnroll } from './quick-enroll/quick-enroll';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, AdminHome, QuickEnroll],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss']
})
export class AdminComponent {

  currentView: 'home' | 'enroll' = 'home';

  constructor(private token: TokenService) {}

  onViewChange(view: 'home' | 'enroll'): void {
    this.currentView = view;
  }

  logout(): void {
    this.token.logout();
  }
}