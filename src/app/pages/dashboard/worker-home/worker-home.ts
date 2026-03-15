import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerService } from '../../../services/worker.service';
import { TokenService } from '../../../core/services/token.service';
import { HotToastService } from '@ngneat/hot-toast';
import { ClockService } from '../../../core/services/clock.service';

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
  errorMessage = 'An unexpected error occurred';

  shiftDurationRunning = '00:00:00';
  isWeekend = false;
  showModal = false;

  private shiftInterval: any;

  constructor(
    private workerservice: WorkerService,
    private token: TokenService,
    private toast: HotToastService,
    public clock: ClockService
  ) {}

  ngOnInit(): void {
    this.userId = this.token.getItem('userId') || '';
    this.userName = this.token.getItem('userName') || 'Worker';

    if (this.userId) this.loadTodayInfo();

    this.checkWeekend();
    this.updateShiftDuration();
    this.shiftInterval = setInterval(() => this.updateShiftDuration(), 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.shiftInterval);
  }

  loadTodayInfo(): void {
    this.isLoading = true;
    this.workerservice.getTodayAttendance().subscribe({
      next: (res) => {
        this.data = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isError = true;
        this.isLoading = false;
      }
    });
  }

  checkWeekend(): void {
    const day = new Date().getDay();
    this.isWeekend = day === 0 || day === 6;
  }

  updateShiftDuration(): void {
    if (this.data?.status !== 'SignedIn' || !this.data?.signInTime) return;

    const now = new Date();
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
    this.workerservice.signIn().subscribe({
      next: () => {
        this.isLoading = false;
        this.loadTodayInfo();
        this.toast.success('Signed In Successfully!');
      },
      error: (err) => {
        this.isLoading = false;
        this.toast.error(this.errorMessage);
      }
    });
  }

  signOff(): void {
    this.isLoading = true;
    this.workerservice.signOff().subscribe({
      next: () => {
        this.isLoading = false;
        this.loadTodayInfo();
        this.toast.success('Signed Off Successfully!');
      },
      error: (err) => {
        this.isLoading = false;
        this.toast.error(this.errorMessage);
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