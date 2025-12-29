import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { Id } from 'convex/_generated/dataModel';
import { UserService } from '../../user.service';
import { AdminUser, ExecutiveUser, UserDetail } from '../interfaces/userinterface';

interface AdminUserDetail {
  _id: Id<'admin_users'>;
  name: string;
  email: string;
  phone?: string;
  roleLevel: number;
  roleName: string;
  hierarchyName: string;
  hierarchyPath: string;
  isActive: boolean;
  lastLogin?: number;
  createdAt: number;
  // Add more detailed fields as needed
}

@Component({
  selector: 'app-view-user-drawer',
  standalone: true,
  imports: [
    CommonModule,
    DrawerModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './view-user-drawer.component.html',
  styleUrls: ['./view-user-drawer.component.scss'],
})
export class ViewUserDrawerComponent implements OnChanges {
  @Input() userId: Id<'admin_users'> | Id<'executives'> | null = null;
  @Input() userType: 'admin' | 'executive' = 'admin';
  @Input() visible = false;
  @Output() onClose = new EventEmitter<void>();

  private userService = inject(UserService);
  
  userDetail: UserDetail | null = null;
  isLoading = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible']?.currentValue && this.userId && this.visible) {
      this.loadUserDetail();
    }
    if (changes['visible']?.currentValue === false) {
      this.userDetail = null;
    }
  }

  async loadUserDetail() {
    if (!this.userId) return;
    
    try {
      this.isLoading = true;
      this.userDetail = null;

      if (this.userType === 'admin') {
        this.userDetail = await this.userService.getAdminById(this.userId as Id<'admin_users'>);
      } else {
        this.userDetail = await this.userService.getExecutiveById(this.userId as Id<'executives'>);
      }
    } catch (error) {
      console.error(`Failed to load ${this.userType} detail:`, error);
    } finally {
      this.isLoading = false;
    }
  }

  closeDrawer() {
    this.onClose.emit();
  }

  formatDate(timestamp: number | undefined): string {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isAdmin(): boolean {
    return this.userType === 'admin' && !!this.userDetail;
  }

  isExecutive(): boolean {
    return this.userType === 'executive' && !!this.userDetail;
  }

  getStatusClass(): string {
    return this.userDetail?.isActive ? 'status-active' : 'status-inactive';
  }

  getRoleBadgeClass(): string {
    if (!this.isAdmin() || !this.userDetail) return '';
    const roleLevel = (this.userDetail as AdminUser).roleLevel;
    if (roleLevel >= 12) return 'badge-super-admin';
    if (roleLevel >= 10) return 'badge-state';
    if (roleLevel >= 8) return 'badge-zonal';
    if (roleLevel >= 6) return 'badge-district';
    return 'badge-coordinator';
  }

  // ✅ SAFE HELPER METHODS - No more type casting errors!
getAdminRoleName(): string {
  return this.isAdmin() && this.userDetail ? (this.userDetail as AdminUser).roleName : 'N/A';
}

getAdminLastLogin(): string {
  return this.isAdmin() && this.userDetail 
    ? this.formatDate((this.userDetail as AdminUser).lastLogin) 
    : 'N/A';
}

getEmployeeId(): string {
  return this.isExecutive() && this.userDetail 
    ? (this.userDetail as ExecutiveUser).employeeId 
    : 'N/A';
}

getJobTitle(): string {
  return this.isExecutive() && this.userDetail 
    ? (this.userDetail as ExecutiveUser).jobTitle || 'N/A' 
    : 'N/A';
}

getWardId(): string {
  return this.isExecutive() && this.userDetail 
    ? (this.userDetail as ExecutiveUser).wardId 
    : 'N/A';
}

}