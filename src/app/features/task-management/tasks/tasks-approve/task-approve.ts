// src/app/features/task-management/components/task-approve/task-approve.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';

// ✅ Import from centralized models
import { EnrichedTask, TaskStatus,TaskPriority  } from '../../models';
import { TaskService } from '../../services/task.service';
import { MenuModule } from 'primeng/menu';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DrawerModule } from "primeng/drawer";
import { ConfirmDialogModule } from "primeng/confirmdialog";

@Component({
  selector: 'app-task-approve',
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
    TooltipModule,
    ProgressBarModule,
    MenuModule,
    ToastModule,
    DrawerModule,
    ConfirmDialogModule
],
   providers: [ConfirmationService, MessageService],
  templateUrl: './task-approve.html',
   styleUrls: ['./task-approve.scss']
})
export class TaskApproveComponent implements OnInit {
  tasks: EnrichedTask[] = [];
  isLoading = true;

  selectedTask: EnrichedTask | null = null;
  showSideDrawer = false;
  constructor(
    private taskService: TaskService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    await this.loadTasks();
  }

  // In your approval-queue component
async loadTasks() {
  try {
    this.isLoading = true;
    console.log('🔄 Loading pending approvals...');
    
    // ✅ Use the correct query that includes approvalId
    this.tasks = await this.taskService.getPendingApprovals();
    
    console.log('✅ Tasks loaded:', this.tasks.length);
    console.log('🔍 First task approvalId:', this.tasks[0]?.approvalId);
    
  } catch (error) {
    console.error('❌ Error loading tasks:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load approval tasks'
    });
  } finally {
    this.isLoading = false;
  }
}

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
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

  formatDueDate(timestamp: number): string {
    return this.taskService.formatDueDate(timestamp);
  }

getPrioritySeverity(priority: TaskPriority): 'success' | 'info' | 'warn' | 'danger' {
  switch (priority as string) {  // ✅ Cast to string
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

async approveTask(task: EnrichedTask) {
  console.log("🔍 [FRONTEND] Task full object:", task);
  console.log("🔍 [FRONTEND] approvalId:", task.approvalId);
  console.log("🔍 [FRONTEND] approvalId type:", typeof task.approvalId);
  
  // ✅ SAFETY CHECK
  if (!task.approvalId) {
    console.error("❌ NO APPROVAL ID! Cannot approve");
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No approval ID found for this task',
      life: 3000,
    });
    return;
  }

  this.confirmationService.confirm({
    message: `Approve "${task.title}"?`,
    accept: async () => {
      try {
        console.log("🔍 [FRONTEND] CALLING SERVICE with approvalId:", task.approvalId);
        await this.taskService.approveTaskCompletion(task.approvalId!);
        console.log("✅ [FRONTEND] SERVICE CALLED SUCCESSFULLY");
        
        await this.loadTasks();
        this.messageService.add({
          severity: 'success',
          summary: 'Approved!',
          detail: `${task.title} approved`,
          life: 3000,
        });
      } catch (error: any) {
        console.error("❌ [FRONTEND] Service error:", error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.message || 'Approval failed',
          life: 3000,
        });
      }
    }
  });
}

async rejectTask(task: EnrichedTask) {
  const reason = prompt('Rejection reason (required):');
  if (!reason?.trim()) return;

  this.confirmationService.confirm({
    message: `Reject "${task.title}"?\n\nReason: ${reason}`,
    header: 'Confirm Rejection',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await this.taskService.rejectTaskCompletion(task.approvalId!, reason);
        this.messageService.add({
          severity: 'warn',
          summary: 'Rejected',
          detail: `${task.title} rejected`,
          life: 3000,
        });
        await this.loadTasks();
      } catch (error: any) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.message || 'Rejection failed',
          life: 3000,
        });
      }
    }
  });
}

 viewTask(task: EnrichedTask) {
    this.selectedTask = task;
    this.showSideDrawer = true;  // ✅ OPEN DRAWER
  }
 closeDrawer() {
    this.showSideDrawer = false;
    this.selectedTask = null;
  }
}
