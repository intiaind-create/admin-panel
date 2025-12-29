import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { UserService } from '@/features/user-management/user.service';
import { AuthService } from '@/core/services/auth.service';
import { TaskService, TopPerformer } from '@/features/settings/services/task.service';

@Component({
  standalone: true,
  selector: 'app-top-executives-widget', // Rename the selector
  imports: [CommonModule, AvatarModule],
  templateUrl: './top-executives-widget.component.html'
})
export class TopExecutivesWidgetComponent implements OnInit {
  topExecutives: TopPerformer[] = [];
  isLoading = true;
  errorMessage = '';
  hasPermission = false;

  constructor(
    private taskService: TaskService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    // ✅ Check permission first
    const user = this.authService.currentUser();
    this.hasPermission = !!user && user.roleLevel >= 6;

    if (this.hasPermission) {
      await this.loadTopPerformers();
    } else {
      this.isLoading = false;
      this.errorMessage = 'Requires manager or higher role';
    }
  }

  async loadTopPerformers() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.topExecutives = await this.taskService.getTopPerformers();
    } catch (error: any) {
      console.error('Failed to load top performers:', error);
      this.errorMessage = error?.message || 'Failed to load data';
      this.topExecutives = [];
    } finally {
      this.isLoading = false;
    }
  }
}