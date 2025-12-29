import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KnobModule } from 'primeng/knob';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../dashboard.service'; 
import { AuthService } from '@/core/services/auth.service';
import { MyTaskStats, TaskService, TaskStats } from '@/features/settings/services/task.service';

@Component({
  standalone: true,
  selector: 'app-status-widget',
  imports: [CommonModule, KnobModule, FormsModule],
  templateUrl: './statuswidget.component.html'
})
export class StatusWidgetComponent implements OnInit {
stats: TaskStats | MyTaskStats | null = null;
 @Input() color: string = '#2196F3'; 
  isLoading = true;
  errorMessage = '';

  constructor(
    private taskService: TaskService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.loadStats();
  }

  async loadStats() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const user = this.authService.currentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // ✅ Get appropriate stats based on role
      if (user.roleLevel >= 4) {
        // Admin/Manager - get all task stats
        this.stats = await this.taskService.getTaskStats();
      } else {
        // Executive - get my task stats
        this.stats = await this.taskService.getMyTaskStats();
      }
    } catch (error: any) {
      console.error('Failed to load task stats:', error);
      this.errorMessage = error?.message || 'Failed to load stats';
    } finally {
      this.isLoading = false;
    }
  }

  // Helper getters for display
  get tasksCompletedToday(): number {
    return this.stats?.completed || 0;
  }

  get pendingApprovals(): number {
    return this.stats?.pending || 0;
  }

  get tasksAssignedToday(): number {
    return this.stats?.inProgress || 0;
  }
}