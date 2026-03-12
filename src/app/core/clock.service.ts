// src/app/core/clock.service.ts
import { Injectable, OnDestroy } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClockService implements OnDestroy {

  clockHour = '00';
  clockMinute = '00';
  clockAmPm = '';
  clockDay = '';
  clockDate = '';
  timeOfDay = 'Day';

  private interval: any;

  constructor() {
    this.update();
    this.interval = setInterval(() => this.update(), 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  private update(): void {
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
  }
}