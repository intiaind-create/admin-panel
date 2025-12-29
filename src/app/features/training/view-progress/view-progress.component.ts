import { Component, OnInit, signal, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ProgressService } from '../services/progress.service';
import { TrainingProgress } from '../interfaces/training.interface';


@Component({
  selector: 'app-view-progress',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ChartModule,
    TableModule,
    ProgressBarModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    ToastModule,
    DialogModule,
  ],
  providers: [MessageService],
  templateUrl: './view-progress.component.html',
  styleUrls: ['view-progress.component.scss'],
})
export class ViewProgressComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  progressList = signal<TrainingProgress[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  selectedProgress: TrainingProgress | null = null;
  detailsDialogVisible = false;

  // Chart data
  chartData: any;
  chartOptions: any;

  // Computed statistics
  completedCount = computed(() =>
    this.progressList().filter((p) => p.status === 'completed').length
  );

  inProgressCount = computed(() =>
    this.progressList().filter((p) => p.status === 'in_progress').length
  );

  failedCount = computed(() =>
    this.progressList().filter((p) => p.status === 'failed').length
  );

  notStartedCount = computed(() =>
    this.progressList().filter((p) => p.status === 'not_started').length
  );

  averageCompletion = computed(() => {
    const list = this.progressList();
    if (list.length === 0) return 0;
    const total = list.reduce((sum, p) => sum + p.progressPercentage, 0);
    return Math.round(total / list.length);
  });

  successRate = computed(() => {
    const total = this.progressList().length;
    if (total === 0) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  // Filter options
  selectedStatus: 'not_started' | 'in_progress' | 'completed' | 'failed' | null =
    null;

  statusOptions = [
    { label: 'All', value: null },
    { label: 'Not Started', value: 'not_started' as const },
    { label: 'In Progress', value: 'in_progress' as const },
    { label: 'Completed', value: 'completed' as const },
    { label: 'Failed', value: 'failed' as const },
  ];

  constructor(
    private progressService: ProgressService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.setupChart();
    this.loadProgressData(null);
  }

  setupChart() {
    this.chartData = {
      labels: ['Not Started', 'In Progress', 'Completed', 'Failed'],
      datasets: [
        {
          label: 'Training Progress Distribution',
          data: [0, 0, 0, 0],
          backgroundColor: [
            'rgba(255, 159, 64, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(75, 192, 75, 0.8)',
            'rgba(255, 99, 99, 0.8)',
          ],
          borderWidth: 0,
        },
      ],
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            font: {
              size: 14,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce(
                (a: number, b: number) => a + b,
                0
              );
              const percentage =
                total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    };
  }

  async loadProgressData(event: TableLazyLoadEvent | null) {
    this.loading.set(true);
    try {
      const numItems = event?.rows || 50;
      const result = await this.progressService.listProgress(
        numItems,
        null,
        undefined,
        undefined,
        this.selectedStatus || undefined
      );

      this.progressList.set(result.page as TrainingProgress[]);
      this.totalRecords.set(
        result.continueCursor ? result.continueCursor.length : result.page.length
      );
      this.updateChart();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load progress data',
      });
    } finally {
      this.loading.set(false);
    }
  }

  private updateChart() {
    this.chartData = {
      ...this.chartData,
      datasets: [
        {
          ...this.chartData.datasets[0],
          data: [
            this.notStartedCount(),
            this.inProgressCount(),
            this.completedCount(),
            this.failedCount(),
          ],
        },
      ],
    };
  }

  async viewDetails(progress: TrainingProgress) {
    this.selectedProgress = progress;
    this.detailsDialogVisible = true;
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    const severityMap: Record<string, any> = {
      completed: 'success',
      in_progress: 'info',
      not_started: 'secondary',
      failed: 'danger',
    };
    return severityMap[status] || 'info';
  }

  getProgressColor(percentage: number): string {
    if (percentage === 100) return 'success';
    if (percentage >= 50) return 'info';
    if (percentage > 0) return 'warn';
    return 'danger';
  }

  onStatusChange() {
    this.loadProgressData(null);
  }

  onGlobalFilter(event: Event) {
    this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  clearFilters() {
    this.selectedStatus = null;
    this.dt.clear();
    this.loadProgressData(null);
  }

  async downloadCertificate(progress: TrainingProgress) {
    if (!progress.certificateId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Certificate',
        detail: 'Certificate not yet generated',
      });
      return;
    }

    try {
      const url = await this.progressService.getCertificateUrl(
        progress.certificateId
      );
      if (url) {
        window.open(url, '_blank');
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Certificate opened in new tab',
        });
      } else {
        throw new Error('Certificate URL not found');
      }
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to download certificate',
      });
    }
  }

async generateCertificate(progress: TrainingProgress) {
  if (progress.status !== 'completed') {
    this.messageService.add({
      severity: 'warn',
      summary: 'Cannot Generate',
      detail: 'Certificate can only be generated for completed courses',
    });
    return;
  }

  if (progress.certificateId) {
    this.messageService.add({
      severity: 'info',
      summary: 'Already Generated',
      detail: 'Certificate already exists. Click download to view.',
    });
    return;
  }

  this.loading.set(true);
  try {
    await this.progressService.generateCertificate(progress._id);
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Certificate generated successfully',
    });
    await this.loadProgressData(null);
  } catch (error: any) {
    const msg: string =
      error?.message ||
      error?.data?.message || // convex client sometimes puts it here
      '';

    if (msg === 'NO_CERTIFICATE_TEMPLATE') {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Template',
        detail: 'Please upload a certificate template for this course first.',
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: msg || 'Failed to generate certificate',
      });
    }
  } finally {
    this.loading.set(false);
  }
}

  exportProgress() {
    const headers = [
      'Executive Name',
      'Course Title',
      'Status',
      'Progress %',
      'Completed Modules',
      'Total Modules',
      'Final Score',
      'Started Date',
      'Completed Date',
    ];

    const data = this.progressList().map((progress) => [
      progress.executiveName || 'N/A',
      progress.courseTitle || 'N/A',
      progress.status,
      progress.progressPercentage,
      progress.completedModules,
      progress.totalModules,
      progress.finalScore || 'N/A',
      new Date(progress.startedAt).toLocaleDateString(),
      progress.completedAt
        ? new Date(progress.completedAt).toLocaleDateString()
        : 'N/A',
    ]);

    const csv = [headers, ...data.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `training-progress-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Progress data exported successfully',
    });
  }

  async sendReminder(progress: TrainingProgress) {
    if (progress.status === 'completed') {
      this.messageService.add({
        severity: 'info',
        summary: 'No Action Needed',
        detail: 'Training already completed',
      });
      return;
    }

    try {
      // TODO: Call backend to send email/notification
      this.messageService.add({
        severity: 'success',
        summary: 'Reminder Sent',
        detail: `Reminder sent to ${progress.executiveName}`,
      });
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to send reminder',
      });
    }
  }

  closeDialog() {
    this.detailsDialogVisible = false;
    this.selectedProgress = null;
  }

  calculateTimeSpent(progress: TrainingProgress): string {
    if (!progress.completedAt) return 'N/A';

    const diffMs = progress.completedAt - progress.startedAt;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  }

  refresh() {
    this.loadProgressData(null);
  }
}
