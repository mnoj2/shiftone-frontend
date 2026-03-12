import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../services/attendance.service';
import { TokenService } from '../../../core/token.service';
import { ErrorHandler } from '../../../utils/error-handler.util';

@Component({
  selector: 'app-supervisor-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supervisor-home.html',
  styleUrls: ['./supervisor-home.scss']
})
export class SupervisorHome implements OnInit, OnDestroy {

  userName = 'Supervisor';
  isLoading = false;
  isError = false;
  errorMessage = '';

  homeData: any = null;
  selectedHomeDate: string | null = null;
  maxDate = '';
  minDate = '2025-12-17';

  clockHour = '00';
  clockMinute = '00';
  clockAmPm = '';
  clockDay = '';
  clockDate = '';
  timeOfDay = 'Day';

  @ViewChild('dateInput') dateInput!: ElementRef;
  private clockInterval: any;

  constructor(
    private attendance: AttendanceService,
    private token: TokenService
  ) {}

  ngOnInit(): void {
    const token = this.token.getToken();
    if (token) {
      const decoded = this.token.getDecodedToken(token);
      if (decoded) this.userName = decoded['name'] || 'Supervisor';
    }

    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    this.loadHomeData();
  }

  ngOnDestroy(): void {
    clearInterval(this.clockInterval);
  }

  updateClock(): void {
    const now = new Date();
    const hours = now.getHours();
    const twelveHour = hours % 12 || 12;

    this.clockHour = twelveHour.toString().padStart(2, '0');
    this.clockMinute = now.getMinutes().toString().padStart(2, '0');
    this.clockAmPm = hours >= 12 ? 'PM' : 'AM';
    this.clockDay = now.toLocaleDateString('en-US', { weekday: 'short' }) + ',';
    this.clockDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    this.maxDate = now.toISOString().split('T')[0];

    if (hours < 12) this.timeOfDay = 'Morning';
    else if (hours < 18) this.timeOfDay = 'Afternoon';
    else this.timeOfDay = 'Evening';
  }

  loadHomeData(date: string | null = null): void {
    this.selectedHomeDate = date;
    this.isLoading = true;
    this.isError = false;
    this.attendance.getSupervisorHomeSummary(date).subscribe({
      next: (res) => {
        this.homeData = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isError = true;
        this.errorMessage = ErrorHandler.getErrorMessage(err);
        this.isLoading = false;
      }
    });
  }

  triggerDatePicker(): void {
    this.dateInput?.nativeElement.showPicker();
  }

  onHomeDateChange(event: any): void {
    this.loadHomeData(event.target.value);
  }

  resetHomeDate(): void {
    if (this.dateInput) this.dateInput.nativeElement.value = '';
    this.loadHomeData(null);
  }

  getHomeDisplayDate(): string {
    if (!this.selectedHomeDate) return "Today's Overview";
    return new Date(this.selectedHomeDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
}