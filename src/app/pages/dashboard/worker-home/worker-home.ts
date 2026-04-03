import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerService } from '../../../services/worker.service';
import { HotToastService } from '@ngneat/hot-toast';

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
    private toast: HotToastService
  ) {}

  // Initializes attendance data, checks for past errors, and starts the real-time clock
  ngOnInit(): void {
    this.loadTodayInfo();
    this.checkUnfinishedRecords(); 
    this.checkWeekend();
    this.updateShiftDuration();

    // Updates the duration display every second
    this.shiftInterval = setInterval(() => this.updateShiftDuration(), 1000);
  }

  // Cleans up the interval timer when the component is destroyed to prevent memory leaks
  ngOnDestroy(): void {
    clearInterval(this.shiftInterval);
  }

  // Fetches the current day's attendance record from the worker service
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

  // Calculates the elapsed time from sign-in to the current moment for the live timer
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
    
    // Pads single digits with a leading zero for HH:MM:SS format
    this.shiftDurationRunning = [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  }

  // Determines whether to start a shift or show a confirmation modal to end one
  onToggleShift(): void {
    if (this.isWeekend && this.data?.status !== 'SignedIn') return;
    if (this.data?.status === 'SignedIn') this.showModal = true;
    else this.signIn();
  }

  // Closes the modal and proceeds with the sign-off process
  confirmEndShift(): void {
    this.showModal = false;
    this.signOff();
  }

  // Handles the Sign-In process including browser-level geolocation capture
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

  // Handles the Sign-Off process including browser-level geolocation capture
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

  // Scans history for past records that remain in a 'SignedIn' state
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

  // Formats a UTC date string into a localized 12-hour format for India
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

  // Converts decimal hour values into a human-readable "X hr Y min" string
  formatHours(hours: number | null): string {
    if (!hours || hours <= 0) return '-';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h > 0 ? `${h} hr ${m} min` : `${m} min`;
  }

  // Checks the current day to identify if it is Saturday (6) or Sunday (0)
  checkWeekend(): void {
    const day = new Date().getDay();
    this.isWeekend = day === 0 || day === 6;
  }
}