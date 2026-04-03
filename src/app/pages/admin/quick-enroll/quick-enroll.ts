import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminService } from '../../../services/admin.service';
import { HotToastService } from '@ngneat/hot-toast';

@Component({
  selector: 'app-quick-enroll',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quick-enroll.html',
  styleUrls: ['./quick-enroll.scss']
})
export class QuickEnroll {

  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly MAX_SIZE_MB = 5;
  private extractionSub: Subscription | null = null;

  isExtracting = false;
  isAdding = false;
  previewUrl: string | null = null;
  showPasswordState = false;
  uploadedFile: File | null = null;

  roles = ['Worker', 'Supervisor', 'Admin'];
  emailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
  phonePattern = '^[0-9]{10}$';

  user = { name: '', email: '', phone: '', password: '', role: 'Worker' };

  constructor(
    private adminService: AdminService,
    private toast: HotToastService
  ) {}

  // #region Upload
  // Validates file type and size before storing the file and generating a preview URL
  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    input.value = '';

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.toast.error('Only JPG, PNG and WebP images are allowed');
      return;
    }

    if (file.size > this.MAX_SIZE_MB * 1024 * 1024) {
      this.toast.error(`File size must be under ${this.MAX_SIZE_MB}MB`);
      return;
    }

    this.uploadedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
  // #endregion

  // #region Scan
  // Sends the uploaded image to the OCR service and populates the form with extracted data
  scanForm(): void {
    if (!this.uploadedFile) {
      this.toast.error('Please upload a form first');
      return;
    }

    this.isExtracting = true;
    this.extractionSub = this.adminService.scanForm(this.uploadedFile).subscribe({
      next: (res) => {
        this.user.name  = res.name  || '';
        this.user.email = res.email || '';
        this.user.phone = res.phone || '';
        this.user.role  = res.role  || 'Worker';
        this.isExtracting = false;
        this.extractionSub = null;
        this.toast.success('Form scanned successfully');
      },
      error: () => {
        this.toast.error('OCR extraction failed');
        this.isExtracting = false;
        this.extractionSub = null;
      }
    });
  }

  // Cancels the ongoing OCR scan by unsubscribing from the active request
  cancelScan(): void {
    this.extractionSub?.unsubscribe();
    this.extractionSub = null;
    this.isExtracting = false;
    this.toast.error('Scan cancelled');
  }
  // #endregion

  // #region Save User
  addUser(form: any): void {
    if (form.invalid) {
      this.toast.error('Please fill in all required fields correctly');
      return;
    }
    this.isAdding = true;
    this.adminService.createUser(this.user).subscribe({
      next: () => {
        this.toast.success('User created successfully');
        this.isAdding = false;
        this.reset(form);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to create user');
        this.isAdding = false;
      }
    });
  }

  // Resets the form and user model, preserving the uploaded image for potential re-use
  reset(form: any): void {
    this.user = { name: '', email: '', phone: '', password: '', role: 'Worker' };
    // this.previewUrl = null;
    // this.uploadedFile = null;
    this.showPasswordState = false;
    this.extractionSub = null;
    form.resetForm();
  }

  clearImage(): void {
    this.previewUrl = null;
    this.uploadedFile = null;
  }
  // #endregion

  togglePassword(): void {
    this.showPasswordState = !this.showPasswordState;
  }
}