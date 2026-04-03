import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupervisorService } from '../../../services/supervisor.service';
import { TokenService } from '../../../core/services/token.service';
import * as Highcharts from 'highcharts';
import { HighchartsChartComponent } from 'highcharts-angular';

@Component({
  selector: 'app-supervisor-home',
  standalone: true,
  imports: [CommonModule, FormsModule, HighchartsChartComponent],
  templateUrl: './supervisor-home.html',
  styleUrls: ['./supervisor-home.scss']
})
export class SupervisorHome implements OnInit {

  userName = 'Supervisor';
  isLoading = false;
  isError = false;
  errorMessage = 'An unexpected error occurred';

  // --- Home ---
  homeData: any = null;
  selectedHomeDate: string | null = null;
  maxDate = new Date().toISOString().split('T')[0];
  minDate = '2025-12-17';

  // --- Analytics ---
  analyticsLoading = false;
  analyticsData: any = null;
  hoursChartOptions: Highcharts.Options = {};
  updateHoursChart = false;
  hasMonthlyData = false;

  months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
  years: number[] = [];
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  @ViewChild('dateInput') dateInput!: ElementRef;

  constructor(
    private supervisorservice: SupervisorService,
    private token: TokenService
  ) {}

  ngOnInit(): void {
    // Extract the supervisor's name from the decoded token
    const token = this.token.getToken();
    if (token) {
      const decoded = this.token.getDecodedToken(token);
      if (decoded) this.userName = decoded['name'] || 'Supervisor';
    }
    this.generateYearList();
    this.loadHomeData();
    this.loadAnalytics();
  }

  // --- Home Logic ---

  // Fetches the home summary for the given date, or today if no date is provided
  loadHomeData(date: string | null = null): void {
    this.selectedHomeDate = date;
    this.isLoading = true;
    this.isError = false;

    this.supervisorservice.getSupervisorHomeSummary(date).subscribe({
      next: (res) => {
        this.homeData = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isError = true;
        this.isLoading = false;
      }
    });
  }

  // Programmatically opens the date picker input
  triggerDatePicker(): void {
    this.dateInput?.nativeElement.showPicker();
  }

  // Reloads home data when the user selects a different date
  onHomeDateChange(event: any): void {
    this.loadHomeData(event.target.value);
  }

  // Clears the selected date and reloads today's summary
  resetHomeDate(): void {
    if (this.dateInput) this.dateInput.nativeElement.value = '';
    this.loadHomeData(null);
  }

  // Returns a formatted display label for the currently selected home date
  getHomeDisplayDate(): string {
    if (!this.selectedHomeDate) return "Today's Overview";
    return new Date(this.selectedHomeDate).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  }

  // --- Analytics Logic ---

  // Builds the list of selectable years, including next year if past October
  generateYearList(): void {
    const currentYear = new Date().getFullYear();
    this.years = [];
    for (let y = 2025; y <= currentYear; y++) this.years.push(y);
    if (new Date().getMonth() >= 9) this.years.push(currentYear + 1);
  }

  // Fetches analytics data for the selected month and year and renders the chart if data exists
  loadAnalytics(): void {
    this.analyticsLoading = true;

    this.supervisorservice.getAnalytics(this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => {
        this.analyticsData = res;
        this.hasMonthlyData = res?.monthlyHours?.length > 0;
        this.analyticsLoading = false;
        if (this.hasMonthlyData) this.renderMonthlyChart(res.monthlyHours);
      },
      error: (err) => {
        this.analyticsLoading = false;
      }
    });
  }

  // Builds and applies the Highcharts area chart configuration for monthly working hours, excluding weekends
  private renderMonthlyChart(monthlyHours: any[]): void {
    const filtered = monthlyHours.filter(x => {
      const day = new Date(`${x.date} ${this.selectedYear}`).getDay();
      return day !== 0 && day !== 6;
    });

    this.hoursChartOptions = {
      chart: { type: 'areaspline', backgroundColor: 'transparent', style: { fontFamily: 'inherit' } },
      title: { text: '' },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        categories: filtered.map(x => x.date),
        labels: { style: { color: '#444' } },
        title: { text: 'Date', style: { color: '#444', fontWeight: 'bold' } }
      },
      yAxis: {
        min: 0,
        title: { text: 'Hours', style: { color: '#444', fontWeight: 'bold' } },
        labels: { style: { color: '#444' } },
        gridLineColor: 'rgba(0,0,0,0.05)'
      },
      tooltip: {
        backgroundColor: '#1c1c1c',
        style: { color: '#fff' },
        borderRadius: 8,
        headerFormat: '<b>{point.key}</b><br/>',
        pointFormatter: function () { return `Work Hours: ${this.y}`; }
      },
      plotOptions: {
        areaspline: {
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [[0, 'rgba(16, 185, 129, 0.4)'], [1, 'rgba(16, 185, 129, 0)']]
          },
          marker: { radius: 4, lineColor: '#10b981', lineWidth: 2, fillColor: '#fff' },
          lineColor: '#10b981',
          lineWidth: 3
        }
      },
      series: [{
        name: 'Production Man-Hours',
        type: 'areaspline',
        data: filtered.map(x => x.hours)
      } as Highcharts.SeriesAreasplineOptions]
    };

    this.updateHoursChart = true;
  }
}