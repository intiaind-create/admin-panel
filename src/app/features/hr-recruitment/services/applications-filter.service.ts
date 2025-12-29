import { ConvexService } from "@/core/services/convex.service";
import { inject, signal, computed, DestroyRef, effect, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { api } from "convex/_generated/api";
import { JobApplication, ApplicationFilters, ApplicationStats, ApplicationsResponse } from "../interfaces/application.interface";
import { WardsService } from "./wards.service";

@Injectable({
  providedIn: 'root'
})
export class ApplicationsFilterService {
  private readonly convex = inject(ConvexService);
  private readonly wardsService = inject(WardsService);
  private readonly destroyRef = inject(DestroyRef);
  
  private readonly _rootId = signal<string>('');
  private readonly _applications = signal<ApplicationsResponse>({ items: [], total: 0 });
  private readonly _isLoading = signal(false);

  // ✅ Filter signals
  readonly jobPostingId = signal<string | null>(null);
  readonly status = signal<JobApplication['status'] | null>(null);
  readonly searchQuery = signal<string | null>(null);
  readonly dateFrom = signal<number | null>(null);
  readonly dateTo = signal<number | null>(null);

  // ✅ Pagination signals
  readonly currentPage = signal(0);
  readonly pageSize = signal(100);

  readonly isLoading = this._isLoading.asReadonly();
  readonly applications = this._applications.asReadonly();

  // ✅ Computed: Combined filters for Convex query
  private readonly activeFilters = computed((): ApplicationFilters => ({
    ...this.wardsService.getFilterState(),
    jobPostingId: this.jobPostingId(),
    status: this.status(),
    searchQuery: this.searchQuery(),
    dateFrom: this.dateFrom(),
    dateTo: this.dateTo(),
  }));

  // ✅ Auto-fetch when filters change
  constructor() {
    effect(() => {
      // Track filter changes
      const filters = this.activeFilters();
      const page = this.currentPage();
      const pageSize = this.pageSize();
      
      // Trigger fetch
      this.fetchApplications();
    });
  }

  /**
   * Fetch applications using client.query()
   */
  private async fetchApplications(): Promise<void> {
    const rootId = this._rootId();
    if (!rootId) return;

    this._isLoading.set(true);

    try {
      // ✅ Use client.query() - returns Promise<ApplicationsResponse>
      const result = await this.convex.client.query(
        api.applications.listFiltered,
        {
          rootId,
          filters: this.activeFilters(),
          pagination: {
            page: this.currentPage(),
            pageSize: this.pageSize(),
          }
        }
      );

      this._applications.set(result);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      this._applications.set({ items: [], total: 0 });
    } finally {
      this._isLoading.set(false);
    }
  }

  // ✅ Computed: Statistics
  readonly stats = computed((): ApplicationStats => {
    const apps = this.applications().items;
    
    const byStatus = apps.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byZone = apps.reduce((acc, app) => {
      if (app.zone) acc[app.zone] = (acc[app.zone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byDistrict = apps.reduce((acc, app) => {
      if (app.district) acc[app.district] = (acc[app.district] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const selected = byStatus['selected'] || 0;
    const total = apps.length;
    const conversionRate = total > 0 ? (selected / total) * 100 : 0;

    return {
      totalApplications: this.applications().total,
      byStatus,
      byZone,
      byDistrict,
      conversionRate,
    };
  });

  // ✅ Computed: Has active filters
  readonly hasActiveFilters = computed(() => {
    const filters = this.activeFilters();
    return !!(
      filters.zone ||
      filters.district ||
      filters.jobPostingId ||
      filters.status ||
      filters.searchQuery
    );
  });

  /**
   * Set rootId from auth context
   */
  setRootId(rootId: string): void {
    this._rootId.set(rootId);
  }

  /**
   * Clear all filters
   */
  clearAllFilters(): void {
    this.jobPostingId.set(null);
    this.status.set(null);
    this.searchQuery.set(null);
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.wardsService.clearFilters();
    this.currentPage.set(0);
  }

  /**
   * Refresh applications data
   */
  async refresh(): Promise<void> {
    await this.fetchApplications();
  }

  /**
   * Bulk update application status
   */
  async bulkUpdateStatus(
    applicationIds: string[],
    newStatus: JobApplication['status']
  ): Promise<void> {
    // ✅ Use client.mutation()
    await this.convex.client.mutation(
      api.applications.bulkUpdateStatus,
      { applicationIds, status: newStatus }
    );
    
    // Refresh after mutation
    await this.refresh();
  }

  /**
   * Export filtered applications to CSV
   */
  async exportToCSV(): Promise<Blob> {
    // ✅ Use client.query() for export
    const data = await this.convex.client.query(
      api.applications.exportFiltered,
      {
        rootId: this._rootId(),
        filters: this.activeFilters(),
      }
    );

    // Convert to CSV
    const headers = [
      'Name', 'Email', 'Phone', 'Job Title', 'Status', 
      'Zone', 'District', 'Subdistrict', 'Local Body', 'Ward',
      'Experience', 'Applied Date'
    ].join(',');

    const rows = data.map((app: JobApplication) => [
      app.name,
      app.email,
      app.phone,
      app.jobPostingId, // You'll need to resolve job title
      app.status,
      app.zone || '',
      app.district || '',
      app.subdistrict || '',
      app.localBodyName || '',
      app.wardName || '',
      app.experience,
      new Date(app.createdAt).toLocaleDateString(),
    ].join(','));

    const csv = [headers, ...rows].join('\n');
    return new Blob([csv], { type: 'text/csv' });
  }

  /**
   * Navigate pagination
   */
  nextPage(): void {
    const total = this.applications().total;
    const maxPage = Math.ceil(total / this.pageSize()) - 1;
    if (this.currentPage() < maxPage) {
      this.currentPage.update(p => p + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(Math.max(0, page));
  }
}