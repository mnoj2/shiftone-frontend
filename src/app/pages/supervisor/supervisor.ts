import { Component, OnInit } from '@angular/core';
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
export class Supervisor implements OnInit  {

  currentView: 'home' | 'daily' | 'analytics' = 'home';
  userName = '';

  constructor(
    private token: TokenService
  ) {}

  ngOnInit(): void {
    this.userName = this.token.getItem('userName') ?? '';
  }


  onViewChange(view: 'home' | 'daily' | 'analytics'): void {
    this.currentView = view;
  }

  logout(): void {
    this.token.logout();
  }
}