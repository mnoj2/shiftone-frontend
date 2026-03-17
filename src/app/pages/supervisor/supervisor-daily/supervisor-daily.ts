import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupervisorService } from '../../../services/supervisor.service';
import { HotToastService } from '@ngneat/hot-toast';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { appGridTheme } from '../../../utils/ag-grid-theme';
import 'ag-grid-enterprise';

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

  today = ''
  dailyStart = '';
  dailyEnd = '';

  gridTheme = appGridTheme;
  private gridApi: any;

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
      valueFormatter: p => p.value || '-',
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
    private supervisorservice: SupervisorService,
    private toast: HotToastService
  ) {}

  ngOnInit(): void {
    this.today = new Date().toISOString().split('T')[0];
    this.dailyStart = this.today;
    this.dailyEnd = this.today;
    this.filterDaily();
  }

  onGridReady(params: any): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  filterDaily(): void {
    if (!this.dailyStart || !this.dailyEnd) return;

    if (new Date(this.dailyStart) > new Date(this.dailyEnd)) {
      this.toast.error('Start date must be before end date');
      return;
    }

    this.isLoading = true;
    this.isError = false;
    this.supervisorservice.getByDateRange(this.dailyStart, this.dailyEnd).subscribe({
      next: (res) => {
        this.records = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isError = true;
        this.errorMessage = err.error?.message || 'Failed to load records';
        this.isLoading = false;
      }
    });
  }

  exportDaily(): void {
    if (!this.records.length) {
      this.toast.error('No data to export');
      return;
    }
    this.gridApi.exportDataAsExcel({
      fileName: 'Attendance_Report.xlsx',
      sheetName: 'Attendance Report'
    });
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

  formatHours(hours: number | null): string {
    if (!hours || hours <= 0) return '-';
    let h = Math.floor(hours);
    let m = Math.round((hours - h) * 60);
    if (m === 60) { h += 1; m = 0; }
    if (h > 0 && m === 0) return `${h} hr`;
    return h > 0 ? `${h} hr ${m} min` : `${m} min`;
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }
}