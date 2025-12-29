// src/app/features/task-management/tasks/tasks-list/tasks-list.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MenuModule } from 'primeng/menu';
import { MenuItem, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';

// ✅ Import from centralized models and service
import { EnrichedTask, TaskStatus, TaskPriority } from '../../models';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    AvatarModule,
    IconFieldModule,
    InputIconModule,
    MenuModule,
    TooltipModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './tasks.list.component.html',
  styleUrls: ['./tasks-list.component.scss']
})
export class TaskListComponent implements OnInit {
  tasks: EnrichedTask[] = [];
  isLoading = true;
  actionMenuItems: MenuItem[] = [];

  constructor(
    private taskService: TaskService,
    private messageService: MessageService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadTasks();
  }

async loadTasks() {
  this.isLoading = true;
  try {
    console.log('🔍 Loading tasks...');
    console.log('🔐 Auth token:', localStorage.getItem('convex-token')); // Debug
    
    const result = await this.taskService.listTasks(
      { numItems: 100, cursor: null }
    );
    
    console.log('✅ Tasks loaded:', result); // Debug
    this.tasks = result.page;
  } catch (error: any) {
    console.error('❌ Failed to load tasks:', error);
    console.error('Error details:', error.message, error.stack); // Debug
    
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to load tasks',
      life: 3000
    });
  } finally {
    this.isLoading = false;
  }
}
  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  onActionsMenuClick(menu: any, event: any, task: EnrichedTask) {
    this.actionMenuItems = [
      {
        label: 'View Details',
        icon: 'pi pi-eye',
        command: () => this.viewTask(task)
      },
      {
        label: 'Edit Task',
        icon: 'pi pi-pencil',
        command: () => this.editTask(task)
      },
      {
        label: 'Reassign',
        icon: 'pi pi-user-edit',
        command: () => this.reassignTask(task)
      },
      {
        separator: true
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteTask(task),
        styleClass: 'text-red-500'
      }
    ];
    menu.toggle(event);
  }

  viewTask(task: EnrichedTask) {
    // TODO: Navigate to task details or open dialog
    console.log('View task:', task);
  }

  editTask(task: EnrichedTask) {
    // TODO: Navigate to edit page or open dialog
    this.router.navigate(['tasks/tasks-edit/', task._id]);
  }

  async reassignTask(task: EnrichedTask) {
    // TODO: Open reassign dialog
    console.log('Reassign task:', task);
  }

  async deleteTask(task: EnrichedTask) {
    // TODO: Add confirmation dialog
    try {
      await this.taskService.deleteTask(task._id);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Task deleted successfully',
        life: 3000
      });
      await this.loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete task',
        life: 3000
      });
    }
  }

  getSeverity(status: TaskStatus): 'success' | 'info' | 'warn' | 'danger' {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'pending':
        return 'warn';
      case 'overdue':
        return 'danger';
      default:
        return 'info';
    }
  }

  getPrioritySeverity(priority: TaskPriority): 'success' | 'info' | 'warn' | 'danger' {
    switch (priority) {
      case 'low':
        return 'success';
      case 'medium':
        return 'info';
      case 'high':
        return 'warn';
      case 'urgent':
        return 'danger';
      default:
        return 'info';
    }
  }

  formatDueDate(timestamp: number): string {
    return this.taskService.formatDueDate(timestamp);
  }

  navigateToCreate() {
    this.router.navigate(['tasks/tasks-add']);
  }
}
