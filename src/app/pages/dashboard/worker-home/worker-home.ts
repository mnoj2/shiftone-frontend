import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../services/attendance.service';
import { TokenService } from '../../../core/token.service';
import { HotToastService } from '@ngneat/hot-toast';
import { ErrorHandler } from '../../../utils/error-handler.util';

@Component({
  selector: 'app-worker-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './worker-home.html',
  styleUrls: ['./worker-home.scss']
})
export class WorkerHome implements OnInit, OnDestroy {

  data: any = {};
  userId = '';
  userName = 'Worker';
  isLoading = false;
  isError = false;
  errorMessage = '';

  shiftDurationRunning = '00:00:00';
  isWeekend = false;
  clockHour = '00';
  clockMinute = '00';
  clockAmPm = '';
  clockDay = '';
  clockDate = '';
  timeOfDay = 'Day';
  showModal = false;

  private clockInterval: any;

  constructor(
    private attendance: AttendanceService,
    private token: TokenService,
    private toast: HotToastService
  ) {}

  ngOnInit(): void {
    this.userId = this.token.getItem('userId') || '';
    this.userName = this.token.getItem('userName') || 'Worker';

    if (this.userId) this.loadTodayInfo();

    this.checkWeekend();
    this.updateShiftStats();
    this.clockInterval = setInterval(() => this.updateShiftStats(), 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.clockInterval);
  }

  loadTodayInfo(): void {
    this.isLoading = true;
    this.attendance.getTodayAttendance().subscribe({
      next: (res) => {
        this.data = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isError = true;
        this.errorMessage = ErrorHandler.getErrorMessage(err);
        this.isLoading = false;
      }
    });
  }

  checkWeekend(): void {
    const day = new Date().getDay();
    this.isWeekend = day === 0 || day === 6;
  }

  updateShiftStats(): void {
    const now = new Date();
    const hours = now.getHours();
    const twelveHour = hours % 12 || 12;

    this.clockHour = twelveHour.toString().padStart(2, '0');
    this.clockMinute = now.getMinutes().toString().padStart(2, '0');
    this.clockAmPm = hours >= 12 ? 'PM' : 'AM';
    this.clockDay = now.toLocaleDateString('en-US', { weekday: 'short' }) + ',';
    this.clockDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    if (hours < 12) this.timeOfDay = 'Morning';
    else if (hours < 18) this.timeOfDay = 'Afternoon';
    else this.timeOfDay = 'Evening';

    if (this.data?.status === 'SignedIn' && this.data?.signInTime) {
      const signInTime = this.data.signInTime.endsWith('Z')
        ? this.data.signInTime
        : this.data.signInTime + 'Z';

      const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
      let diffMs = Math.min(now.getTime() - new Date(signInTime).getTime(), EIGHT_HOURS_MS);
      if (diffMs < 0) diffMs = 0;

      const totalSeconds = Math.floor(diffMs / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      this.shiftDurationRunning = [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
    }
  }

  onToggleShift(): void {
    if (this.isWeekend && this.data?.status !== 'SignedIn') return;
    if (this.data?.status === 'SignedIn') this.showModal = true;
    else this.signIn();
  }

  confirmEndShift(): void {
    this.showModal = false;
    this.signOff();
  }

  signIn(): void {
    this.isLoading = true;
    this.attendance.signIn().subscribe({
      next: () => {
        this.isLoading = false;
        this.loadTodayInfo();
        this.toast.success('Signed In Successfully!');
      },
      error: (err) => {
        this.isLoading = false;
        this.toast.error(ErrorHandler.getErrorMessage(err));
      }
    });
  }

  signOff(): void {
    this.isLoading = true;
    this.attendance.signOff().subscribe({
      next: () => {
        this.isLoading = false;
        this.loadTodayInfo();
        this.toast.success('Signed Off Successfully!');
      },
      error: (err) => {
        this.isLoading = false;
        this.toast.error(ErrorHandler.getErrorMessage(err));
      }
    });
  }

  formatTime(time: string | null): string {
    if (!time) return '-';
    const timeValue = time.endsWith('Z') ? time : time + 'Z';
    return new Date(timeValue).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  }

  formatHours(hours: number | null): string {
    if (!hours || hours <= 0) return '-';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h > 0 ? `${h} hr ${m} min` : `${m} min`;
  }
}