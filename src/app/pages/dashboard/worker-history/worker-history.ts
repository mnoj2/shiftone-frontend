import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../services/attendance.service';
import { TokenService } from '../../../core/token.service';
import { HotToastService } from '@ngneat/hot-toast';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { appGridTheme } from '../../../utils/ag-grid-theme';

@Component({
  selector: 'app-worker-history',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './worker-history.html',
  styleUrls: ['./worker-history.scss']
})
export class WorkerHistory implements OnInit {

  isLoading = false;
  isError = false;
  errorMessage = '';
  workHistory: any[] = [];

  gridTheme = appGridTheme;

  showAutoSignOffModal = false;
  pendingRecord: any = null;
  pendingSignOffTimeInput = '';
  isConfirming = false;

  columnDefs: ColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      valueFormatter: p => p.value
        ? new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-'
    },
    {
      field: 'signInTime',
      headerName: 'Sign In',
      cellClass: 'text-center',
      valueFormatter: p => this.formatTime(p.value)
    },
    {
      field: 'signOffTime',
      headerName: 'Sign Off',
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
      headerName: 'Hours',
      cellClass: 'text-center',
      valueFormatter: p => this.formatHours(p.value)
    },
    {
      headerName: 'Actions',
      cellClass: 'd-flex align-items-center justify-content-center',
      width: 120,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: (params: any) => {
        const status = params.value;
        const isWorker = this.token.getRole() === 'Worker';
        const isToday = new Date(params.data.date).toDateString() === new Date().toDateString();

        if (params.data.status === 'SignedIn' && isWorker && !isToday) {
          return `
            <button class="btn btn-sm btn-dark py-0 px-2 fw-bold manual-signoff-btn"
              style="font-size: 0.7rem; height: 24px;">SIGN OFF</button>
          `;
        }

        return `<span class="text-muted">—</span>`;
      },
      onCellClicked: (params: any) => {
        const target = params.event.target as HTMLElement;
        if (target.closest('.manual-signoff-btn')) {
          this.openManualSignOffModal(params.data);
        }
      }
    }
  ];

  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 120,
    sortable: true,
    filter: true,
    resizable: true
  };

  constructor(
    private attendance: AttendanceService,
    private token: TokenService,
    private toast: HotToastService
  ) {}

  ngOnInit(): void {
    if (this.token.getItem('userId')) this.loadWorkHistory();
  }

  loadWorkHistory(): void {
    this.isLoading = true;
    this.attendance.getMyHistory().subscribe({
      next: (res) => {
        this.workHistory = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isError = true;
        this.errorMessage = ErrorHandler.getErrorMessage(err);
        this.isLoading = false;
      }
    });
  }

  openManualSignOffModal(record: any): void {
    this.pendingRecord = record;
    this.pendingSignOffTimeInput = '';
    this.showAutoSignOffModal = true;
  }

  onConfirmAutoSignOff(): void {
    if (!this.pendingSignOffTimeInput || !this.pendingRecord) return;

    this.isConfirming = true;

    const [h, m] = this.pendingSignOffTimeInput.split(':').map(Number);
    const signOffDate = new Date(this.pendingRecord.date);
    signOffDate.setHours(h, m, 0, 0);

    const signInTimeStr = this.pendingRecord.signInTime.endsWith('Z')
      ? this.pendingRecord.signInTime
      : this.pendingRecord.signInTime + 'Z';
    const signInDate = new Date(signInTimeStr);

    if (signOffDate <= signInDate) signOffDate.setDate(signOffDate.getDate() + 1);

    if (signOffDate <= signInDate) {
      this.toast.error('Sign-off time must be after sign-in time');
      this.isConfirming = false;
      return;
    }

    const request = this.pendingRecord.status === 'SignedIn'
      ? this.attendance.manualSignOff(this.pendingRecord.date, signOffDate.toISOString())
      : this.attendance.confirmAutoSignOff(this.pendingRecord.date, signOffDate.toISOString());

    request.subscribe({
      next: () => {
        this.toast.success('Sign-off successful');
        this.isConfirming = false;
        this.showAutoSignOffModal = false;
        this.loadWorkHistory();
      },
      error: (err) => {
        this.toast.error(ErrorHandler.getErrorMessage(err));
        this.isConfirming = false;
      }
    });
  }

  onGridReady(params: any): void {
    params.api.sizeColumnsToFit();
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