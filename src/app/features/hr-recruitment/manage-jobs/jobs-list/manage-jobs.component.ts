import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { Router, RouterLink } from '@angular/router';
import { Id } from 'convex/_generated/dataModel';
import { JobPosting, JobsService } from '../services/jobs.service';

@Component({
  selector: 'app-manage-jobs',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    InputTextModule,
    SelectModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    ConfirmDialogModule,
    MenuModule,
  ],
  templateUrl: './manage-jobs.component.html',
  styleUrls: ['./manage-jobs.component.scss'],

  providers: [MessageService, ConfirmationService],
})
export class ManageJobsComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  jobs = signal<JobPosting[]>([]);
  selectedJobs: JobPosting[] | null = [];
  loading = signal<boolean>(false);
  
  actionMenuItems: MenuItem[] = [];

  constructor(
    private jobsService: JobsService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit() {
    await this.loadJobs();
  }

  /**
   * Load jobs from backend
   */
  async loadJobs() {
    this.loading.set(true);
    try {
      const result = await this.jobsService.getJobs(100); // Load first 100
      this.jobs.set(result.page as JobPosting[]);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load jobs',
      });
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Global table filter
   */
  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  /**
   * Navigate to create new job
   */
  openNew() {
    this.router.navigate(['/recruitment/jobs/new']);
  }

  /**
   * Navigate to edit job
   */
  editJob(job: JobPosting) {
    this.router.navigate(['/recruitment/jobs/edit/', job._id]);
  }

  /**
   * Delete single job
   */
  async deleteJob(job: JobPosting) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${job.title}"?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await this.jobsService.deleteJob(job._id);
          
          // Remove from UI
          this.jobs.update((jobs) => jobs.filter((j) => j._id !== job._id));
          
          this.messageService.add({
            severity: 'success',
            summary: 'Successful',
            detail: 'Job Deleted',
            life: 3000,
          });
        } catch (error: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to delete job',
          });
        }
      },
    });
  }

  /**
   * Delete multiple selected jobs
   */
  async deleteSelectedJobs() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected jobs?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          // Delete all selected jobs
          for (const job of this.selectedJobs || []) {
            await this.jobsService.deleteJob(job._id);
          }

          // Remove from UI
          const selectedIds = this.selectedJobs?.map((j) => j._id);
          this.jobs.update((jobs) =>
            jobs.filter((job) => !selectedIds?.includes(job._id))
          );

          this.selectedJobs = null;
          
          this.messageService.add({
            severity: 'success',
            summary: 'Successful',
            detail: 'Jobs Deleted',
            life: 3000,
          });
        } catch (error: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to delete jobs',
          });
        }
      },
    });
  }

  /**
   * Toggle job active status
   */
  async toggleJobStatus(job: JobPosting) {
    try {
      await this.jobsService.updateJob(job._id, {
        isActive: !job.isActive,
      });

      // Update UI
      this.jobs.update((jobs) =>
        jobs.map((j) =>
          j._id === job._id ? { ...j, isActive: !j.isActive } : j
        )
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Job ${job.isActive ? 'deactivated' : 'activated'}`,
      });
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to update job status',
      });
    }
  }

  /**
   * Get status severity for PrimeNG tag
   */
  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  /**
   * Get employment type label
   */
  getEmploymentTypeLabel(type: string): string {
    const map: Record<string, string> = {
      full_time: 'Full-time',
      part_time: 'Part-time',
      contract: 'Contract',
    };
    return map[type] || type;
  }

  /**
   * Actions menu click
   */
  onActionsMenuClick(menu: any, event: any, job: JobPosting) {
    this.actionMenuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.editJob(job),
      },
      {
        label: job.isActive ? 'Deactivate' : 'Activate',
        icon: job.isActive ? 'pi pi-ban' : 'pi pi-check',
        command: () => this.toggleJobStatus(job),
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteJob(job),
      },
    ];
    menu.toggle(event);
  }
}
