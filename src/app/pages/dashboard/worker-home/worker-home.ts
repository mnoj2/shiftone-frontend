import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerService } from '../../../services/worker.service';
import { TokenService } from '../../../core/services/token.service';
import { HotToastService } from '@ngneat/hot-toast';
import { ClockService } from '../../../core/services/clock.service';

@Component({
  selector: 'app-worker-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './worker-home.html',
  styleUrls: ['./worker-home.scss']
})
export class WorkerHome implements OnInit, OnDestroy {

  data: any = null;

  isLoading = false;
  isError = false;
  errorMessage = 'An unexpected error occurred';

  shiftDurationRunning = '00:00:00';
  isWeekend = false;
  showModal = false;

  private shiftInterval: any;

  constructor(
    private workerservice: WorkerService,
    private toast: HotToastService,
    public clock: ClockService
  ) {}

  ngOnInit(): void {
    this.loadTodayInfo();
    this.checkUnfinishedRecords(); 
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

  updateShiftDuration(): void {
    if (this.data?.status !== 'SignedIn' || !this.data?.signInTime) return;

    const now = new Date();
    const signInTime = this.data.signInTime.endsWith('Z')
      ? this.data.signInTime
      : this.data.signInTime + 'Z';

    let diffMs = now.getTime() - new Date(signInTime).getTime();
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
    if (!navigator.geolocation) {
      this.toast.error('Geolocation is not supported by this browser');
      return;
    }

    this.isLoading = true;

    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.workerservice.signIn(lat, lng).subscribe({
          next: () => {
            this.isLoading = false;
            this.loadTodayInfo();
            this.toast.success('Signed In Successfully!');
          },
          error: (err) => {
            this.isLoading = false;
            this.toast.error(err.error.detail);
          }
        });
    },
    (error) => {
        this.isLoading = false;
        if (error.code === error.PERMISSION_DENIED) {
          this.toast.error('Location permission denied');
        } else {
          this.toast.error('Unable to retrieve location');
        }
      }
    );
  }

  signOff(): void {
    if (!navigator.geolocation) {
      this.toast.error('Geolocation is not supported by this browser');
      return;
    }

    this.isLoading = true;

    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.workerservice.signOff(lat, lng).subscribe({
          next: () => {
            this.isLoading = false;
            this.loadTodayInfo();
            this.toast.success('Signed Off Successfully!');
          },
          error: (err) => {
            this.isLoading = false;
            this.toast.error(err.error.detail);
          }
        });
    },
    (error) => {
        this.isLoading = false;
        if (error.code === error.PERMISSION_DENIED) {
          this.toast.error('Location permission denied');
        } else {
          this.toast.error('Unable to retrieve location');
        }
      }
    );
  }

  checkUnfinishedRecords(): void {
    this.workerservice.getMyHistory().subscribe({
      next: (res) => {
        const today = new Date().toDateString();
        const hasUnfinished = res.some((r: any) =>
          r.status === 'SignedIn' &&
          new Date(r.date).toDateString() !== today
        );
        if (hasUnfinished) {
          this.toast.warning('You have unfinished sign-off records');
        }
      },
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

  checkWeekend(): void {
    const day = new Date().getDay();
    this.isWeekend = day === 0 || day === 6;
  }
}