import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../services/attendance.service';
import { HotToastService } from '@ngneat/hot-toast';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { appGridTheme } from '../../../utils/ag-grid-theme';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-supervisor-daily',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './supervisor-daily.html',
  styleUrls: ['./supervisor-daily.scss']
})
export class SupervisorDaily implements OnInit {

  isLoading = false;
  isError = false;
  errorMessage = '';
  records: any[] = [];

  dailyStart = '';
  dailyEnd = '';

  gridTheme = appGridTheme;

  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 120,
    sortable: true,
    filter: true,
    resizable: true
  };

  dailyColumnDefs: ColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      valueFormatter: p => p.value
        ? new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-'
    },
    {
      field: 'workerName',
      headerName: 'Worker Name',
      valueGetter: p => p.data.workerName || p.data.name
    },
    {
      field: 'signInTime',
      headerName: 'Start Time',
      cellClass: 'text-center',
      valueFormatter: p => this.formatTime(p.value)
    },
    {
      field: 'signOffTime',
      headerName: 'End Time',
      cellClass: 'text-center',
      valueFormatter: p => this.formatTime(p.value)
    },
    {
      field: 'status',
      headerName: 'Status',
      cellClass: 'text-center',
      cellRenderer: (params: any) => {
        const badgeClass: Record<string, string> = {
          'SignedIn': 'signed-in',
          'SignedOff': 'signed-off',
        };
        const cls = badgeClass[params.value] || '';
        return `<span class="status-badge ${cls}">${params.value}</span>`;
      }
    },
    {
      field: 'totalHours',
      headerName: 'Hours Worked',
      cellClass: 'text-center',
      valueFormatter: p => this.formatHours(p.value)
    }
  ];

  constructor(
    private attendance: AttendanceService,
    private toast: HotToastService
  ) {}

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.dailyStart = today;
    this.dailyEnd = today;
    this.filterDaily();
  }

  filterDaily(): void {
    if (!this.dailyStart || !this.dailyEnd) return;
    this.isLoading = true;
    this.isError = false;
    this.attendance.getByDateRange(this.dailyStart, this.dailyEnd).subscribe({
      next: (res) => {
        this.records = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isError = true;
        this.errorMessage = ErrorHandler.getErrorMessage(err);
        this.isLoading = false;
      }
    });
  }

  exportDaily(): void {
    if (!this.records.length) {
      this.toast.error('No data to export');
      return;
    }

    const exportData = this.records.map(r => ({
      Date: new Date(r.date).toLocaleDateString('en-IN'),
      WorkerName: r.workerName || r.name,
      StartTime: this.formatTime(r.signInTime),
      EndTime: this.formatTime(r.signOffTime),
      Status: r.status,
      TotalHours: this.formatHours(r.totalHours)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
    XLSX.writeFile(wb, 'Attendance_Report.xlsx');
  }

  onGridReady(params: any): void {
    params.api.sizeColumnsToFit();
  }

  formatTime(time: string | null): string {
    if (!time) return '-';
    const val = time.endsWith('Z') ? time : time + 'Z';
    return new Date(val).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  }

  formatHours(hrs: number | null): string {
    if (!hrs || hrs <= 0) return '-';
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    return h > 0 ? `${h} hr ${m} min` : `${m} min`;
  }
}