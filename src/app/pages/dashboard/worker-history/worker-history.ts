import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerService } from '../../../services/worker.service';
import { TokenService } from '../../../core/services/token.service';
import { HotToastService } from '@ngneat/hot-toast';
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
  errorMessage = 'An unexpected error occurred';
  workHistory: any[] = [];

  gridTheme = appGridTheme;

  showSignOffModal = false;
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
        const isToday = new Date(params.data.date).toDateString() === new Date().toDateString();

        if (params.data.status === 'SignedIn' && !isToday) {
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
    private workerservice: WorkerService,
    private token: TokenService,
    private toast: HotToastService
  ) {}

  ngOnInit(): void {
    if (this.token.getItem('userId')) this.loadWorkHistory();
  }

  loadWorkHistory(): void {
    this.isLoading = true;
    this.workerservice.getMyHistory().subscribe({
      next: (res) => {
        this.workHistory = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isError = true;
        this.isLoading = false;
      }
    });
  }

  openManualSignOffModal(record: any): void {
    this.pendingRecord = record;
    this.pendingSignOffTimeInput = '';
    this.showSignOffModal = true;
  }

  onConfirmSignOff(): void {
    if (!this.pendingSignOffTimeInput || !this.pendingRecord) return;

    this.isConfirming = true;

    const [h, m] = this.pendingSignOffTimeInput.split(':').map(Number);
    const signOffDate = new Date(this.pendingRecord.date);
    signOffDate.setHours(h, m, 0, 0);

    const signInTimeStr = this.pendingRecord.signInTime.endsWith('Z')
      ? this.pendingRecord.signInTime
      : this.pendingRecord.signInTime + 'Z';
    const signInDate = new Date(signInTimeStr);

    if (signOffDate <= signInDate) {
      signOffDate.setDate(signOffDate.getDate() + 1);
    }

    const diffMs = signOffDate.getTime() - signInDate.getTime();

    if (diffMs <= 0 || diffMs > 12 * 60 * 60 * 1000) {
      this.toast.error('Please enter a valid sign-off time within 12 hours of sign-in');
      this.isConfirming = false;
      return;
    }

    this.workerservice.manualSignOff(this.pendingRecord.date, signOffDate.toISOString()).subscribe({
      next: () => {
        this.toast.success('Sign-off successful');
        this.isConfirming = false;
        this.showSignOffModal = false;
        this.loadWorkHistory();
      },
      error: () => {
        this.toast.error(this.errorMessage);
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
    let h = Math.floor(hours);
    let m = Math.round((hours - h) * 60);
    if (m === 60) {
      h += 1;
      m = 0;
    }
    if(h > 0 && m === 0) return `${h} hr`;
    return h > 0 ? `${h} hr ${m} min` : `${m} min`;
  }
}