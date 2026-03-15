import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { TokenService } from '../../core/services/token.service';
import { HotToastService } from '@ngneat/hot-toast';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { appGridTheme } from '../../utils/ag-grid-theme';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss']
})
export class AdminComponent implements OnInit {

  users: any[] = [];
  isLoading = false;
  gridTheme = appGridTheme;

  columnDefs: ColDef[] = [
    { field: 'name', headerName: 'User Name' },
    { field: 'email', headerName: 'Email' },
    { field: 'phone', headerName: 'Phone', valueFormatter: p => p.value || 'N/A' },
    {
      field: 'role',
      headerName: 'Role',
      cellClass: 'text-center',
      cellRenderer: (params: any) => {
        const cls = this.getRoleBadgeClass(params.value);
        return `<span class="badge ${cls} px-3 py-2 rounded-4" style="font-size: 12px">${params.value}</span>`;
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

        if (isSelf) {
          return `<span class="text-muted small">—</span>`;
        }

        return `
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary border-0 rounded-circle edit-btn"
              style="width:32px;height:32px;padding:0;" title="Edit User">
              <i class="fa-solid fa-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger border-0 rounded-circle delete-btn"
              style="width:32px;height:32px;padding:0;" title="Delete User">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        `;
      },
      onCellClicked: (params: any) => {
        const currentUserId = this.token.getItem('userId');
        const isSelf = String(params.data.id) === String(currentUserId);
        if (isSelf) return;

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

  totalCount = 0;

  editingUser: any = null;
  deleteUserId: number | null = null;
  deleteUserName = '';

  roles = ['Worker', 'Supervisor', 'Admin'];
  emailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(?:\\.[a-zA-Z]{2,})?$';
  phonePattern = '^[0-9]{10}$';

  showAddModal = false;
  isAdding = false;
  showAddPasswordState = false;
  showEditPasswordState = false;

  newUser = { name: '', email: '', phone: '', password: '', role: 'Worker' };

  constructor(
    private adminService: AdminService,
    private toast: HotToastService,
    private token: TokenService,
    private router: Router
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
          const roleDiff = (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99);
          return roleDiff !== 0 ? roleDiff : (a.name || '').localeCompare(b.name || '');
        });
        this.totalCount = this.users.length;
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

  openAddModal(): void {
    this.newUser = { name: '', email: '', phone: '', password: '', role: 'Worker' };
    this.showAddModal = true;
    this.showAddPasswordState = false;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  addUser(form: any): void {
    if (form.invalid) {
      this.toast.error('Please fill in all required fields correctly');
      return;
    }
    this.isAdding = true;
    this.adminService.createUser(this.newUser).subscribe({
      next: () => {
        this.toast.success('User created successfully');
        this.isAdding = false;
        this.showAddModal = false;
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to create user');
        this.isAdding = false;
      }
    });
  }

  toggleAddPassword(): void { this.showAddPasswordState = !this.showAddPasswordState; }
  toggleEditPassword(): void { this.showEditPasswordState = !this.showEditPasswordState; }

  logout(): void {
    this.token.logout();
  }

  getRoleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      Admin: 'bg-dark',
      Supervisor: 'bg-secondary',
      Worker: 'bg-light text-dark border'
    };
    return map[role] ?? 'bg-secondary';
  }
}