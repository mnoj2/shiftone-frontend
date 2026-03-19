import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { TokenService } from '../../../core/services/token.service';
import { HotToastService } from '@ngneat/hot-toast';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { appGridTheme } from '../../../utils/ag-grid-theme';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './admin-home.html',
  styleUrls: ['./admin-home.scss']
})
export class AdminHome implements OnInit {

  users: any[] = [];
  isLoading = false;
  gridTheme = appGridTheme;

  columnDefs: ColDef[] = [
    { field: 'name', headerName: 'User Name' },
    { field: 'email', headerName: 'Email' },
    { field: 'phone', headerName: 'Phone' },
    {
      field: 'role', headerName: 'Role',
      cellClass: 'text-center',
      cellRenderer: (params: any) => {
        const cls = this.getRoleClass(params.value);
        return `<span class="role-pill ${cls}">${params.value}</span>`;
      }
    },
        {
      headerName: 'Actions',
      cellClass: 'd-flex align-items-center justify-content-center',
      pinned: 'right',
      width: 120,
      cellRenderer: (params: any) => {
        const currentUserId = this.token.getItem('userId');
        const isSelf = String(params.data.id) === String(currentUserId);

        return `
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary border-0 rounded-circle edit-btn"
              style="width:32px;height:32px;padding:0;" title="Edit User">
              <i class="fa-solid fa-pencil"></i>
            </button>
            ${!isSelf ? `
            <button class="btn btn-sm btn-outline-danger border-0 rounded-circle delete-btn"
              style="width:32px;height:32px;padding:0;" title="Delete User">
              <i class="fa-solid fa-trash-can"></i>
            </button>
            ` : ''}
          </div>
        `;
      },
      onCellClicked: (params: any) => {
        const target = params.event.target as HTMLElement;
        if (target.closest('.edit-btn')) this.editUser(params.data);
        else if (target.closest('.delete-btn')) this.confirmDelete(params.data);
      }
    }
  ];

  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 150,
    sortable: true,
    filter: true,
    resizable: true
  };

  editingUser: any = null;
  deleteUserId: number | null = null;
  deleteUserName = '';

  roles = ['Worker', 'Supervisor', 'Admin'];
  emailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
  phonePattern = '^[0-9]{10}$';
  showEditPasswordState = false;

  constructor(
    private adminService: AdminService,
    private toast: HotToastService,
    private token: TokenService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe({
      next: (res) => {
        const roleOrder: Record<string, number> = { Admin: 0, Supervisor: 1, Worker: 2 };
        this.users = res.sort((a: any, b: any) => {
          const roleDiff = (roleOrder[a.role]) - (roleOrder[b.role]);
          return roleDiff !== 0 ? roleDiff : a.name.localeCompare(b.name);
        });
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Failed to load users');
        this.isLoading = false;
      }
    });
  }

  onGridReady(params: any): void {
    params.api.sizeColumnsToFit();
  }

  // #region Edit User
  editUser(user: any): void {
    this.editingUser = { ...user, password: '' };
    this.showEditPasswordState = false;
  }

  cancelEdit(): void {
    this.editingUser = null;
  }

  updateUser(form: any): void {
    if (form.invalid || !this.editingUser) return;
    const { id, name, email, phone, role, password } = this.editingUser;
    this.adminService.updateUserDetails(id, { name, email, phone, role, password }).subscribe({
      next: () => {
        this.toast.success('User updated successfully');
        this.editingUser = null;
        this.loadUsers();
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to update details')
    });
  }
  // #endregion

  // #region Delete User
  confirmDelete(user: any): void {
    this.deleteUserId = user.id;
    this.deleteUserName = user.name;
  }

  cancelDelete(): void {
    this.deleteUserId = null;
    this.deleteUserName = '';
  }

  deleteUser(): void {
    if (this.deleteUserId === null) return;
    this.adminService.deleteUser(this.deleteUserId).subscribe({
      next: (success) => {
        if (success) {
          this.toast.success('User deleted successfully');
          this.cancelDelete();
          this.loadUsers();
        } else {
          this.toast.error('User could not be deleted');
        }
      },
      error: () => this.toast.error('Failed to delete user')
    });
  }
  // #endregion

  togglePassword(): void {
    this.showEditPasswordState = !this.showEditPasswordState;
  }

  getRoleClass(role: string): string {
    const map: Record<string, string> = {
      Admin:      'role-admin',
      Supervisor: 'role-supervisor',
      Worker:     'role-worker'
    };
    return map[role] ?? 'role-worker';
  }
}