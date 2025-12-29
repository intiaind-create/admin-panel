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
import { ExecutiveUser } from '../../interfaces/userinterface'; // ✅ SHARED INTERFACE
import { ViewUserDrawerComponent } from '../../slideindrawer/view-user-drawer.component'; // ✅ REUSABLE DRAWER

// ✅ SHARED DROPDOWN INTERFACES
interface StatusOption {
  value: boolean | null;
  label: string;
}

@Component({
  selector: 'app-executive-list',
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
    ViewUserDrawerComponent, // ✅ REUSABLE DRAWER
  ],
  providers: [MessageService],
  templateUrl: './executive-list.component.html',
  styleUrls: ['./executive-list.component.scss'],
})
export class ExecutiveListComponent implements OnInit {
  // Data signals - FULLY TYPED from shared interface
  executives = signal<ExecutiveUser[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Filter signals
  searchQuery = signal('');
  selectedStatus = signal<boolean | null>(null);

  // Pagination signals
  totalRecords = signal(0);
  hasMore = signal(true);
  continueCursor = signal<string | null>(null);

  // Drawer signals
  selectedExecutiveId = signal<Id<'executives'> | null>(null);
  drawerVisible = signal(false);
  selectedUserType = signal<'admin' | 'executive'>('executive');

  // Dropdown options
  statusOptions: StatusOption[] = [
    { value: null, label: 'All Status' },
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' },
  ];

  displayedExecutives = computed(() => {
    let filtered = this.executives();

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      filtered = filtered.filter(exec =>
        exec.name.toLowerCase().includes(query) ||
        exec.employeeId.toLowerCase().includes(query)
      );
    }

    const status = this.selectedStatus();
    if (status !== null) {
      filtered = filtered.filter(exec => exec.isActive === status);
    }

    return filtered;
  });

  constructor(
    private userService: UserService,
    private router: Router,
    private messageService: MessageService
  ) {
    effect(() => {
      this.totalRecords.set(this.displayedExecutives().length);
    });
  }

  async ngOnInit() {
    await this.loadExecutives();
  }

  async loadExecutives(loadMore = false) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const cursor = loadMore ? this.continueCursor() ?? null : null;
      const result = await this.userService.getExecutives(
        { numItems: 50, cursor },
        {}
      );

      if (loadMore) {
        this.executives.update(current => [...current, ...result.page]);
      } else {
        this.executives.set(result.page);
      }

      this.hasMore.set(!result.isDone);
      this.continueCursor.set(result.continueCursor ?? null);
    } catch (error: any) {
      console.error('Failed to load executives:', error);
      this.errorMessage.set(error?.message || 'Failed to load executives');
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
    await this.loadExecutives(true);
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  onStatusFilter(status: boolean | null) {
    this.selectedStatus.set(status);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set(null);
  }

  navigateToCreateExecutive() {
    this.router.navigate(['/user-management/executives/create']);
  }

  editExecutive(executive: ExecutiveUser) {
    this.router.navigate(['/user-management/executives/edit', executive._id]);
  }

  // ✅ PERFECT DRAWER INTEGRATION
  viewExecutive(executive: ExecutiveUser) {
    this.selectedExecutiveId.set(executive._id as Id<'executives'>);
    this.selectedUserType.set('executive');
    this.drawerVisible.set(true);
  }

  closeDrawer() {
    this.drawerVisible.set(false);
    this.selectedExecutiveId.set(null);
  }

  async deleteExecutive(executive: ExecutiveUser) {
    if (!confirm(`Are you sure you want to delete ${executive.name}?`)) return;

    try {
      await this.userService.deleteExecutive(executive._id as Id<'executives'>);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Executive deleted successfully',
        life: 3000,
      });
      await this.loadExecutives();
    } catch (error: any) {
      console.error('Failed to delete executive:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error?.message || 'Failed to delete executive',
        life: 3000,
      });
    }
  }

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
