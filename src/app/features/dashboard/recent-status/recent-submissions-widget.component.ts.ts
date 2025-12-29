import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../dashboard.service';
import { TimelineModule } from 'primeng/timeline'
import { CommonModule } from '@angular/common';
import { AuthService } from '@/core/services/auth.service';
import { EnrichedTask, TaskService } from '@/features/settings/services/task.service';

type RecentActivity = EnrichedTask | {
  _id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: number;
  createdAt: number;
};


@Component({
  selector: 'app-recent-submissions-widget',
  standalone: true,
    imports: [
    CommonModule,
    TimelineModule ],
  templateUrl: './recent-submissions-widget.component.html'
})
export class RecentSubmissionsWidgetComponent implements OnInit {
  submissions: any[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private taskService: TaskService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.loadRecentSubmissions();
  }

  async loadRecentSubmissions() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const user = this.authService.currentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // ✅ Admins/Managers see recent activity
      if (user.roleLevel >= 4) {
        const result = await this.taskService.getRecentActivity(10);
        this.submissions = result || [];
      } else {
        // ✅ Executives see their own tasks
        const result = await this.taskService.getMyTasks({});
        this.submissions = result || [];
      }
    } catch (error: any) {
      console.error('Failed to load recent submissions:', error);
      this.errorMessage = error?.message || 'Failed to load data';
      this.submissions = [];
    } finally {
      this.isLoading = false;
    }
  }

  // ✅ Helper to get timestamp - works with both types
  getTimestamp(item: RecentActivity): number {
    return (item as any).createdAt || (item as any)._creationTime || Date.now();
  }

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}