import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../services/attendance.service';
import { ErrorHandler } from '../../../utils/error-handler.util';
import * as Highcharts from 'highcharts';
import { HighchartsChartComponent } from 'highcharts-angular';

@Component({
  selector: 'app-supervisor-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, HighchartsChartComponent],
  templateUrl: './supervisor-analytics.html',
  styleUrls: ['./supervisor-analytics.scss']
})
export class SupervisorAnalytics implements OnInit {

  isLoading = false;
  isError = false;
  errorMessage = '';

  months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
  years: number[] = [];
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  analyticsData: any = null;
  hoursChartOptions: Highcharts.Options = {};
  updateHoursChart = false;
  hasMonthlyData = false;

  constructor(private attendance: AttendanceService) {}

  ngOnInit(): void {
    this.generateYearList();
    this.loadAnalytics();
  }

  generateYearList(): void {
    const currentYear = new Date().getFullYear();
    this.years = [];
    for (let y = 2025; y <= currentYear; y++) this.years.push(y);
    if (new Date().getMonth() >= 9) this.years.push(currentYear + 1);
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.isError = false;
    this.attendance.getAnalytics(this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => {
        this.analyticsData = res;
        this.hasMonthlyData = res?.monthlyHours?.length > 0;
        this.isLoading = false;
        if (this.hasMonthlyData) this.renderMonthlyChart(res.monthlyHours);
      },
      error: (err) => {
        this.isError = true;
        this.errorMessage = ErrorHandler.getErrorMessage(err);
        this.isLoading = false;
      }
    });
  }

  private renderMonthlyChart(monthlyHours: any[]): void {
    const filtered = monthlyHours.filter(x => {
      const day = new Date(`${x.date} ${this.selectedYear}`).getDay();
      return day !== 0 && day !== 6;
    });

    this.hoursChartOptions = {
      chart: {
        type: 'areaspline',
        backgroundColor: 'transparent',
        style: { fontFamily: 'inherit' }
      },
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
        pointFormatter: function () { return `Production Time: ${this.y}h`; }
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