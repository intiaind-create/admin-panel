import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

// Services & Shared Interfaces
import { UserService } from '../../../user.service';
import { Id } from 'convex/_generated/dataModel';
import { AdminUser, RoleOption, StatusOption } from '../../interfaces/userinterface';
import { ViewUserDrawerComponent } from '../../slideindrawer/view-user-drawer.component';

@Component({
  selector: 'app-admin-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ToastModule,
    IconFieldModule,
    InputIconModule,
    SkeletonModule,
    TooltipModule,
    ViewUserDrawerComponent
  ],
  providers: [MessageService],
  templateUrl: './admin-list.component.html',
  styleUrls: ['./admin-list.component.scss'],
})
export class AdminListComponent implements OnInit {
  // Data signals - FULLY TYPED from shared interface
  admins = signal<AdminUser[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Filter signals
  searchQuery = signal('');
  selectedRoleLevel = signal<number | null>(null);
  selectedStatus = signal<boolean | null>(null);

  // Pagination signals
  totalRecords = signal(0);
  hasMore = signal(true);
  continueCursor = signal<string | null>(null);

  // Drawer signals
  selectedAdminId = signal<Id<'admin_users'> | null>(null);
  drawerVisible = signal(false);
  selectedUserType = signal<'admin' | 'executive'>('admin');

  // ✅ FIXED: Role options matching backend definitions
  roleOptions: RoleOption[] = [
    { value: null, label: 'All Roles' }, // ✅ Added "All" option
    { value: 12, label: 'Super Admin' },
    { value: 11, label: 'State Head' },
    { value: 10, label: 'State Manager' },
    { value: 9, label: 'Zonal Head' },
    { value: 8, label: 'Zonal Manager' },
    { value: 7, label: 'District Head' },
    { value: 6, label: 'District Manager' },
    { value: 5, label: 'Ward Coordinator' },
    { value: 4, label: 'Block Coordinator' },
    { value: 1, label: 'Field Executive' },
  ];

  statusOptions: StatusOption[] = [
    { value: null, label: 'All Status' },
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' },
  ];

  // ✅ Computed property for filtered admins
  displayedAdmins = computed(() => {
    let filtered = this.admins();

    // Search filter
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      filtered = filtered.filter(admin => 
        admin.name.toLowerCase().includes(query) ||
        admin.email.toLowerCase().includes(query)
      );
    }

    // Role filter
    const roleLevel = this.selectedRoleLevel();
    if (roleLevel !== null) {
      filtered = filtered.filter(admin => admin.roleLevel === roleLevel);
    }

    // Status filter
    const status = this.selectedStatus();
    if (status !== null) {
      filtered = filtered.filter(admin => admin.isActive === status);
    }

    return filtered;
  });

  constructor(
    private userService: UserService,
    private router: Router,
    private messageService: MessageService
  ) {
    // ✅ Update total records when filtered admins change
    effect(() => {
      this.totalRecords.set(this.displayedAdmins().length);
    });
  }

  async ngOnInit() {
    await this.loadAdmins();
    await this.loadRoles();
  }
async loadRoles() {
  const roles = await this.userService.getAvailableRoles();
  this.roleOptions = [
    { value: null, label: 'All Roles' },
    ...roles
  ];
}
  async loadAdmins(loadMore = false) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const cursor = loadMore ? this.continueCursor() ?? null : null;
      const result = await this.userService.getAdmins({ numItems: 50, cursor });

      if (loadMore) {
        this.admins.update(current => [...current, ...result.page]);
      } else {
        this.admins.set(result.page);
      }

      this.hasMore.set(!result.isDone);
      this.continueCursor.set(result.continueCursor ?? null);
    } catch (error: any) {
      console.error('❌ Failed to load admins:', error);
      this.errorMessage.set(error?.message || 'Failed to load admins');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: this.errorMessage() ?? undefined,
        life: 3000,
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadMore() {
    if (!this.hasMore() || this.isLoading()) return;
    await this.loadAdmins(true);
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  onRoleFilter(roleLevel: number | null) {
    this.selectedRoleLevel.set(roleLevel);
  }

  onStatusFilter(status: boolean | null) {
    this.selectedStatus.set(status);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedRoleLevel.set(null);
    this.selectedStatus.set(null);
  }

  navigateToCreateAdmin() {
    this.router.navigate(['/user-management/admins/create']);
  }

  editAdmin(admin: AdminUser) {
    this.router.navigate(['/user-management/admins/edit', admin._id]);
  }

  viewAdmin(admin: AdminUser) {
    this.selectedAdminId.set(admin._id as Id<'admin_users'>);
    this.selectedUserType.set('admin');
    this.drawerVisible.set(true);
  }

  closeDrawer() {
    this.drawerVisible.set(false);
    this.selectedAdminId.set(null);
  }

  async deleteAdmin(admin: AdminUser) {
    if (!confirm(`Are you sure you want to delete ${admin.name}?`)) return;

    try {
      await this.userService.deleteAdmin(admin._id as Id<'admin_users'>);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Admin deleted successfully',
        life: 3000,
      });
      await this.loadAdmins();
    } catch (error: any) {
      console.error('❌ Failed to delete admin:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error?.message || 'Failed to delete admin',
        life: 3000,
      });
    }
  }

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  /**
   * ✅ UPDATED: Badge classes matching backend role levels
   */
  getRoleBadgeClass(roleLevel: number): string {
    if (roleLevel === 12) return 'badge-super-admin';  // Super Admin
    if (roleLevel >= 10) return 'badge-state';         // State level (10-11)
    if (roleLevel >= 8) return 'badge-zonal';          // Zonal level (8-9)
    if (roleLevel >= 6) return 'badge-district';       // District level (6-7)
    if (roleLevel >= 4) return 'badge-block';          // Block level (4-5)
    return 'badge-field';                              // Field level (1)
  }

  /**
   * ✅ Get role display name
   */
  getRoleDisplayName(roleLevel: number, roleName?: string): string {
    if (roleName) return roleName;
    
    const role = this.roleOptions.find(r => r.value === roleLevel);
    return role?.label || `Level ${roleLevel}`;
  }

  formatLastLogin(timestamp?: number): string {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * ✅ Format hierarchy path for display
   */
  formatHierarchyPath(path?: string): string {
    if (!path) return 'N/A';
    
    // Convert path like "ORG_1/STATE_KERALA/ZONE_SOUTH/" to "Kerala → South"
    const segments = path.split('/').filter(s => s.length > 0);
    return segments
      .map(s => {
        // Remove prefixes like "STATE_", "ZONE_", etc.
        return s.replace(/^(ORG|STATE|ZONE|DISTRICT|BLOCK|WARD)_/i, '')
          .split('_')
          .map(word => word.charAt(0) + word.slice(1).toLowerCase())
          .join(' ');
      })
      .join(' → ');
  }
}
